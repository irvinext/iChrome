/**
 * The OAuth library
 */
define(["jquery", "lodash", "browser/api"], function($, _, Browser) {
	/**
	 * The client constructor
	 *
	 * @constructor
	 * @api    public
	 * @param  {Object}  config                  The configuration
	 * @param  {String}  config.name             The name this configuration can be referenced by
	 * @param  {String}  config.id               Client ID, as provided by the service
	 * @param  {String}  config.secret           Client secret, as provided by the service
	 * @param  {String}  [config.scope]          The scope of this client should be authenticated for, optional
	 * @param  {String}  [config.authURL]        The URL at the service to send the user to for approval, defaults to Google's configuration
	 * @param  {String}  [config.tokenURL]       The URL at the service that the token can be retrieved from, defaults to Google's configuration
	 * @param  {String}  [config.codeParam]      The parameter that the authorization code should be parsed from in the redirectURL, defaults to code
	 * @param  {String}  [config.tokenParams]    The parameters to be POSTed to the tokenURL to retrieve the access token, defaults to Google's configuration
	 * @param  {String}  [config.redirectURL]    The redirect URL to be provided to the service, defaults to ichro.me/auth
	 * @param  {String}  [config.refreshParams]  The parameters to be POSTed to the tokenURL to refresh the access token, defaults to Google's configuration
	 */
	var OAuth = function(config) {
		if (!config || !config.name || !config.id || !config.secret) {
			return "Invalid config";
		}

		this.config = _.assign({
			scope: null,
			codeParam: "code",
			authURL: "https://accounts.google.com/o/oauth2/auth?" +
				"approval_prompt=force&client_id={{clientID}}&redirect_uri={{redirectURL}}&scope={{scope}}&access_type=offline&response_type=code",
			tokenURL: "https://www.googleapis.com/oauth2/v3/token",
			tokenParams: "code={{code}}&client_id={{clientID}}&client_secret={{secret}}&redirect_uri={{redirectURL}}&grant_type=authorization_code",
			refreshParams: "client_id={{clientID}}&client_secret={{secret}}&refresh_token={{refreshToken}}&grant_type=refresh_token",
			//redirectURL: "https://ichro.me/auth"
			redirectURL: "https://" + chrome.runtime.id + ".chromiumapp.org/oauth2"
		}, config);

		this.data = {};
	};


	OAuth.prototype = {
		/**
		 * Returns the token from storage, if it's available and valid or starts
		 * the authentication process.
		 *
		 * @api     public
		 * @param   {Function}  cb      The callback
		 * @param   {Boolean}   silent  Whether or not to retreive the key silently, i.e. just check
		 */
		getToken: function(cb, silent) {
			if (!cb) {
				return;
			}

			if (!this.data.token) {
				this.loadStorage();
			}

			if (this.data.token) {
				if (new Date().getTime() >= this.data.expiry) {
					if (this.data.refreshToken) {
						this.refreshToken(cb);
					}
					else if (!silent) {
						this.startAuthFlow(cb);
					}
					else {
						cb(false);
					}
				}
				else {
					cb(this.data.token, this.data);
				}
			}
			else if (!silent) {
				this.startAuthFlow(cb);
			}
			else {
				cb(false);
			}
		},


		/**
		 * Returns a boolean indicating if a token exists under this configuration
		 *
		 * @api     public
		 * @return  {Boolean}  Whether or not a token exists under this configuration name
		 */
		hasToken: function() {
			if (!this.data.token) {
				this.loadStorage();

				if (!this.data.token) {
					return false;
				}
			}

			return true;
		},


		/**
		 * Loads any stored keys under this configuration's name from the
		 * browser's storage and updates this.data with any available data
		 *
		 * @api     private
		 * @return  {Object}  The data retreived from the browser's storage
		 */
		loadStorage: function() {
			var data = Browser.storage.oauth;

			if (!data) {
				return {};
			}
			else {
				data = JSON.parse(data);

				if (data[this.config.name]) {
					this.data = data[this.config.name];
				}

				return this.data;
			}
		},


		/**
		 * Saves this.data under the configuration name in the browser's storage
		 *
		 * @api     private
		 */
		saveStorage: function() {
			if (this.data && Object.keys(this.data).length) {
				var data = Browser.storage.oauth;

				if (data) {
					data = JSON.parse(data);
				}
				else {
					data = {};
				}

				data[this.config.name] = this.data;

				Browser.storage.oauth = JSON.stringify(data);
			}
		},


		/**
		 * Requests a new token from the server using the refresh token
		 *
		 * @api     private
		 * @param   {Function}  cb  The callback, called with `this`
		 */
		refreshToken: function(cb) {
			var params = this.config.refreshParams
				.replace("{{clientID}}", encodeURIComponent(this.config.id))
				.replace("{{secret}}", encodeURIComponent(this.config.secret))
				.replace("{{refreshToken}}", encodeURIComponent(this.data.refreshToken));


			$.post(this.config.tokenURL, params, function(d) {
				if (typeof d !== "object") {
					d = JSON.parse(d);
				}

				if (!d.error && d.access_token) {
					var data = {
						token: d.access_token,
						type: d.token_type || "Bearer",
						expiry: new Date().getTime() + ((d.expires_in || 315569259) * 1000) // Defaults to +10 years if unavailable
					};

					if (d.refresh_token) {
						data.refreshToken = d.refresh_token;
					}

					// Add any extra data that's been included to the object
					_.assign(data, _.omit(d, "token_type", "access_token", "expires_in", "refresh_token", "type", "token", "expiry", "refreshToken"));

					_.assign(this.data, data);

					this.saveStorage();

					cb.call(this, data.token, data);
				}
			}.bind(this));
		},


		/**
		 * The ID of the currently opened window, false if none exists or true if one is being created.
		 *
		 * This is used to stop multiple windows from being opened on top of each other.
		 *
		 * @type  {Boolean|Number}
		 */
		openWindow: false,


		/**
		 * Opens a panel at the config authURL, starting the authorization process
		 *
		 * @api     private
		 * @param   {Function}  cb  The callback, called with `this`
		 */
		startAuthFlow: function(cb) {
			var that = this;
			
			// Check if chrome APIs are available
			if (typeof chrome === 'undefined') {
				this.showPermissionError("Chrome extension APIs are not available in this context.");
				cb.call(this, false);
				return;
			}
			
			// First, check if permission API is available
			if (!chrome.permissions) {
				// Fall back to checking if identity is directly available
				if (chrome.identity && chrome.identity.launchWebAuthFlow) {
					this.proceedWithAuthFlow(cb);
				} else {
					this.showPermissionError("Required permissions are not available.");
					cb.call(this, false);
				}
				return;
			}
			
			// Request identity permission
			chrome.permissions.request({
				permissions: ['identity']
			}, function(granted) {
				if (granted) {
					// Permission granted, proceed with auth flow
					that.proceedWithAuthFlow(cb);
				} else {
					// Permission denied, show error
					that.showPermissionError("This functionality requires the 'identity' permission to authenticate with external services.");
					cb.call(that, false);
				}
			});
		},

		/**
		 * Shows an error popup about missing permissions
		 * 
		 * @param {String} message The error message to display
		 */
		showPermissionError: function(message) {
			// Create a simple modal dialog
			var overlay = document.createElement('div');
			overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:10000;display:flex;align-items:center;justify-content:center;';
			
			var modal = document.createElement('div');
			modal.style.cssText = 'background:#fff;padding:20px;border-radius:5px;max-width:400px;box-shadow:0 2px 10px rgba(0,0,0,0.2);';
			
			var title = document.createElement('h3');
			title.textContent = 'Permission Required';
			title.style.margin = '0 0 10px';
			
			var content = document.createElement('p');
			content.textContent = message;
			
			var button = document.createElement('button');
			button.textContent = 'OK';
			button.style.cssText = 'padding:8px 16px;background:#4285f4;color:#fff;border:none;border-radius:3px;float:right;cursor:pointer;';
			button.addEventListener('click', function() {
				document.body.removeChild(overlay);
			});
			
			modal.appendChild(title);
			modal.appendChild(content);
			modal.appendChild(button);
			overlay.appendChild(modal);
			
			document.body.appendChild(overlay);
		},

		/**
		 * Proceeds with the actual auth flow after permissions are granted
		 * 
		 * @param {Function} cb The callback function
		 */
		proceedWithAuthFlow: function(cb) {
			var redirectURL = this.config.redirectURL
				.replace("{{name}}", encodeURIComponent(this.config.name));

			var url = this.config.authURL
				.replace("{{clientID}}", encodeURIComponent(this.config.id))
				.replace("{{scope}}", encodeURIComponent(this.config.scope || ""))
				.replace("{{redirectURL}}", encodeURIComponent(redirectURL));

			var that = this;

				// Launch the web auth flow
				chrome.identity.launchWebAuthFlow(
					{
						url: url,
						interactive: true
					},
					function(responseUrl) {
						// Check for error or user cancellation
						if (chrome.runtime.lastError || !responseUrl) {
							console.error("Auth flow failed:", chrome.runtime.lastError);
							cb.call(that, false);
							return;
						}

						// Parse the response URL to extract the authorization code
						var url = new URL(responseUrl);
						var params = {};
						
						// Extract URL parameters
						url.searchParams.forEach(function(value, key) {
							params[key] = value;
						});

						if (params[that.config.codeParam]) {
							// Exchange the code for tokens
							that.exchangeCode(params[that.config.codeParam], cb);
						} else {
							cb.call(that, false);
						}
					}
				);
		},

		/**
		 * Requests a token set from the tokenURL using the received code
		 *
		 * @api     private
		 * @param   {String}    code         The code received from the server
		 * @param   {Function}  cb           The callback, called with `this`
		 */
		exchangeCode: function(code, cb) {
			var params = this.config.tokenParams
				.replace("{{code}}", encodeURIComponent(code))
				.replace("{{clientID}}", encodeURIComponent(this.config.id))
				.replace("{{secret}}", encodeURIComponent(this.config.secret))
				.replace("{{redirectURL}}", encodeURIComponent(this.config.redirectURL
					.replace("{{name}}", encodeURIComponent(this.config.name)))
				);


			$.post(this.config.tokenURL, params, function(d) {
				if (typeof d !== "object") {
					d = JSON.parse(d);
				}

				if (!d.error && d.access_token) {
					var data = {
						token: d.access_token,
						type: d.token_type || "Bearer",
						expiry: new Date().getTime() + ((d.expires_in || 315569259) * 1000) // Defaults to +10 years if unavailable
					};

					if (d.refresh_token) {
						data.refreshToken = d.refresh_token;
					}

					// Add any extra data that's been included to the object
					_.assign(data, _.omit(d, "token_type", "access_token", "expires_in", "refresh_token", "type", "token", "expiry", "refreshToken"));

					this.data = data;

					this.saveStorage();

					cb.call(this, data.token, data);
				}
			}.bind(this));
		},


		/**
		 * Proxies jQuery.ajax, initializing the authorization process if necessary
		 * and adding an Authorization header containing the access token
		 *
		 * @api    public
		 * @param  {Object} config The configuration to be passed to jQuery.ajax.
		 *                         If a beforeSend function is specified it will be
		 *                         called _after_ the authorization header is added.
		 */
		ajax: function(config) {
			this.getToken(function(token, data) {
				if (config.beforeSend) {
					var oldBS = config.beforeSend;
				}

				config.beforeSend = function(xhr) {
					xhr.setRequestHeader("Authorization", ((data && data.type) || "Bearer") + " " + token);

					if (oldBS) {
						oldBS.apply(config, arguments);
					}
				};

				$.ajax(config);
			});
		}
	};

	return OAuth;
});
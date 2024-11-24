define(["widgets/model"], function(WidgetModel) {
	return WidgetModel.extend({
		/*widgetClassname: "refreshable",*/

		defaults: {
			config: {
				user: "0",
				height: 400,
				size: "variable",
				type: "api",
				messages_shown: 10,
				label: "INBOX"
			}
		},

		setListPage: function(labelId) { 
			this.config.label = labelId || "INBOX";
			this.setPage("list"); 
		},
		setLabelsPage: function() { 
			this.setPage("labels"); 
		},
		setMessagePage: function(messageId) { 
			this.messageId = messageId;
			this.email = null;
			this.setPage("message"); 
		},

		setPage: function(newPage) {
			var thisPage = this.page || "list";
			if (thisPage === newPage) {
				return;
			}
			
			this.page = newPage;
			this.saveData();
			this.refresh();
		},

		isPageList: function() { return !this.page || this.page === "list"; },
		isPageLabels: function() { return !this.isPageList() && this.page === "labels"; },
		isPageMessage: function() { return !this.isPageList() && this.page === "message"; },

		/*oAuth: {
			id: "559765430405-jtbjv5ivuc17nenpsl4dfk9r53a3q0hg.apps.googleusercontent.com",
				//secret: "__API_KEY_gmail__",
				secret: "uzvC025Z3R12syGZ52hFDyHx",
				scope: "https://www.googleapis.com/auth/gmail.readonly"
		},*/

		refresh: function() {
			this.refresh_list();
			this.refresh_labels();
			this.refresh_email();
		},


		refresh_list: function() {
			if (this.isPageList()) {
				var source = [
						{
							id: "1",
							from: "John Doe John Doe John Doe John Doe John Doe John Doe John Doe John Doe John Doe John Doe John Doe John Doe John Doe John Doe John Doe ",
							snippet: "This is some snipper 1 This is some snipper 1 This is some snipper 1 This is some snipper 1 This is some snipper 1 This is some snipper 1 ",
							threadId: "1",
							labelIds: ["INBOX"],
							subject: "This is subject 1 This is subject 1 This is subject 1 This is subject 1 This is subject 1 This is subject 1 This is subject 1 This is subject 1 ",
							date: '2021-Jan-12',
							isRead: true
						},
						{
							id: "2",
							from: "John Doe",
							snippet: "This is some snipper 2",
							threadId: "2",
							labelIds: ["INBOX"],
							subject: "This is subject 2",
							date: '2021-Jan-13'
						},
						{
							id: "3",
							from: "John Doe",
							snippet: "This is some snipper 3",
							threadId: "3",
							labelIds: ["INBOX"],
							subject: "This is subject 3",
							date: '2021-Jan-14'
						},
						{
							id: "4",
							from: "John Doe",
							snippet: "This is some snipper 4",
							threadId: "4",
							labelIds: ["INBOX"],
							subject: "This is subject 4",
							date: '2021-Jan-15'
						},
						{
							id: "5",
							from: "John Doe",
							snippet: "This is some snipper 5",
							threadId: "5",
							labelIds: ["INBOX"],
							subject: "This is subject 5",
							date: '2021-Jan-16'
						},
						{
							id: "6",
							from: "John Doe",
							snippet: "This is some snipper 6",
							threadId: "6",
							labelIds: ["INBOX"],
							subject: "This is subject 6",
							date: '2021-Jan-17'
						},
						{
							id: "7",
							from: "John Doe",
							snippet: "This is some snipper 7",
							threadId: "7",
							labelIds: ["INBOX"],
							subject: "This is subject 7",
							date: '2021-Jan-18'
						},
						{
							id: "8",
							from: "John Doe ",
							snippet: "This is some snipper 8",
							threadId: "8",
							labelIds: ["INBOX"],
							subject: "This is subject 8",
							date: '2021-Jan-19'
						},
						{
							id: "9",
							from: "John Doe",
							snippet: "This is some snipper 9",
							threadId: "9",
							labelIds: ["INBOX"],
							subject: "This is subject 9",
							date: '2021-Jan-20'
						},
						{
							id: "10",
							from: "John Doe",
							snippet: "This is some snipper 10",
							threadId: "10",
							labelIds: ["INBOX"],
							subject: "This is subject 10",
							date: '2021-Jan-21'
						}
				];

				messages = [];
				source.forEach(function(m) {
					var message = {
						id: m.id,
						snippet: m.snippet,
						threadId: m.threadId,
						labelIds: m.labelIds,
						subject: m.subject,
						from: m.from,
						date: m.date
					};

					messages.push(message);
				});

				this.data.messages = messages;
				this.saveData(this.data);
				
				return; //TODO : remove this line
				
				this.oAuth.ajax({
					type: "GET",
					data: {
						maxResults: this.config.messages_shown || 10,
						q: "in:inbox",
						// Add metadataHeaders parameter with From header
						metadataHeaders: "From",
						// Add payload/headers to fields parameter
						fields: "messages(id,snippet,threadId,labelIds,subject,internalDate,payload/headers)",
					},
					url: "https://www.googleapis.com/gmail/v1/users/me/messages",
					success: function(d) {
						var messages = [];
				
						if (d && d.messages) {
							d.messages.forEach(function(m) {
								var message = {
									id: m.id,
									snippet: m.snippet,
									threadId: m.threadId,
									labelIds: m.labelIds,
									subject: m.subject,
									date: new Date(parseInt(m.internalDate)).toLocaleDateString(undefined, { dateStyle: 'short' }),
									// Add from and isRead properties
									from: "",
									isRead: true,
								};
				
								// Loop through the headers array and find the From header
								m.payload.headers.forEach(function(h) {
									if (h.name === "From") {
										// Extract the name or email from the value
										var match = h.value.match(/(.*)<(.*)>/);
										if (match) {
											// Use the name if present
											message.from = match[1].trim();
										} else {
											// Use the email otherwise
											message.from = h.value;
										}
									}
								});
				
								// Check the labelIds array and see if it contains UNREAD
								if (m.labelIds.includes("UNREAD")) {
									// Set the isRead flag to false
									message.isRead = false;
								}
				
								messages.push(message);
							});
				
							this.saveData({
								messages: messages,
							});
						}
					}.bind(this),
				});	
	
			}
		},

		refresh_labels: function() {
			if (this.isPageLabels()) {
				if (this.labels) {
					this.saveData();
					return;
				}
				//return;

				this.labels = [
					{
						"id": "INBOX",
						"name": "Inbox"
					},
					{
						"id": "CATEGORY_PERSONAL",
						"name": "Personal"
					},
					{
						"id": "CATEGORY_SOCIAL",
						"name": "Social"
					}
				];

				this.saveData();

				return; //TODO : remove this line

				this.oAuth.ajax({
					type: "GET",
					url: "https://www.googleapis.com/gmail/v1/users/me/labels",
					success: function(d) {
						var labels = [];
						if (d && d.labels) {
							d.labels.forEach(function(l) {
								var label = {
									id: l.id,
									name: l.name
								};
								labels.push(label);
							});

							this.labels = labels;

							this.saveData();
						}
					}.bind(this),
				});

			}
		},
	
		
		refresh_email: function() {
			if (this.isPageMessage()) {

				var from = "alice@example.com";
				var to = "bob@example.com";
				var date = "Sun, 28 Jan 2024 17:16:13 GMT";
				var subject = "Hello from Alice Hello from AliceHello from AliceHello from AliceHello from AliceHello from Alice";
				var text = "Hi Bob,\n\n Hi Bob,\n\n Hi Bob,\n\n Hi Bob,\n\n Hi Bob,\n\n How are you doing?\n\nI just wanted to say hello and see how you are.\n\nBest,\nAlice\ndddddddddddddddddddddddddddddddddddddddddddddddddddddddddd";
				
				this.email = {
					from: from,
					to: to,
					date: date,
					subject: subject,
					text: text
				};				

				this.saveData();
				return; //TODO : remove this line

				var requestedMessageId = this.messageId;

				// Assume you have the message id stored in a variable called messageId
				this.oAuth.ajax({
					type: "GET",
					// Use the users.messages.get method with the user id and the message id
					url: "https://www.googleapis.com/gmail/v1/users/me/messages/" + requestedMessageId,
					// Specify the format of the message, for example full
					data: {format: "full"},
					success: function(d) {
						if (requestedMessageId !== this.messageId) {
							return; //We do not wait for this message already
						}

						// Check if the response has the message resource
						if (d && d.message) {
							// Get the message payload, which contains the headers and the body
							var payload = d.message.payload;
							// Get the headers array, which contains the from, to, date, and subject fields
							var headers = payload.headers;
							// Loop through the headers array and extract the values you need
							var from, to, date, subject;
							for (var i = 0; i < headers.length; i++) {
								var header = headers[i];
								var name = header.name;
								var value = header.value;
								if (name == "From") {
									from = value;
								} else if (name == "To") {
									to = value;
								} else if (name == "Date") {
									var timestamp = Date.parse(value);
									if (!isNaN(timestamp)) {
										var dateObj = new Date(timestamp);
										date = dateObj.toLocaleString();
									} 
								} else if (name == "Subject") {
									subject = value;
								}
							}
							// Get the mimeType of the payload, which indicates the format of the body
							var mimeType = payload.mimeType;
							// Declare a variable to store the email body in text format
							var text;
							// Check the mimeType and decode the body accordingly
							if (mimeType == "text/plain") {
								// The payload itself is the text body, decode its data
								text = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
							} else if (mimeType == "multipart/alternative") {
								// The payload has multiple parts, find the text/plain part and decode its data
								var parts = payload.parts;
								for (var i = 0; i < parts.length; i++) {
									var part = parts[i];
									if (part.mimeType == "text/plain") {
										text = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
										break;
									}
								}
							}

							this.email = {
								from: from,
								to: to,
								date: date,
								subject: subject,
								text: text
							};

							this.saveData();
						}
					}.bind(this),
				});

			}
		}


	});
});
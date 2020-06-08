define(["lodash", "jquery", "widgets/model", "lib/feedlyproxy"], function(_, $, WidgetModel, feedlyProxy) {
	return WidgetModel.extend({
		widgetClassname: "tabbed-corner",

		pro_tooltip: "news",

		refreshInterval: 300000,
		bbctopics: [
			["top", "Top"],
			["world", "World", "world"],
			["wus", "USA & Canada", "world/us_and_canada"],
			["wuk", "UK", "uk"],
			["weu", "Europe", "world/europe"],
			["waf", "Africa", "world/africa"],
			["was", "Asia", "world/asia"],
			["wla", "Latin America", "world/latin_america"],
			["wme", "Middle East", "world/middle_east"],
			["business", "Business", "business"],
			["politics", "Politics", "politics"],
			["health", "Health", "health"],
			["edu", "Education & Family", "education"],
			["scienv", "Science & Environment", "science_and_environment"],
			["tech", "Technology", "technology"],
			["arts", "Entertainment & Arts", "entertainment_and_arts"],
			["topus", "Top / USA & Canada", "", "?edition=uk"],
			["topukus", "Top / UK", "", "?edition=us"],
			["topint", "Top / Rest world", "", "?edition=int"]
		],

		defaults: {
			config: {
				size: "variable",
				title: "i18n.name",
				source: "msn",
				number: 5,
				edition: "en-us",
				topic: "$allStories",
				bbctopic: "top",
				link: "https://news.google.com"
			},

			data: {
				topics: [
					["$allStories", "All"],
					["rt_US", "Top Stories", "cms-amp-AA9tmo2"],
					["rt_usanatnews", "US", "cms-amp-AA9tmo3"],
					["rt_World", "World", "cms-amp-AAaeSyj"],
					["rt_Crime", "Crime", "cms-amp-AAavKVW"],
					["rt_Offbeat", "Offbeat", "cms-amp-AAavKWc"],
					["rt_ScienceAndTechnology", "Technology", "cms-amp-AAavzN1"],
					["rt_Politics", "Politics", "cms-amp-AAaviQH"],
					["rt_Opinion", "Opinion", "cms-amp-AA9tmod"],
					["rt_WeekendReads", "Weekend Reads", "cms-amp-AA9tmoc"],
					["rt_Entertainment", "Entertainment", "cms-amp-AAaviU8"],
					["rt_Business", "Money", "cms-amp-AAaf38w"],
					["rt_Sports", "Sports", "cms-amp-AAavGal"]
				],
				items: [
					{
						"title": "EXCLUSIVE-Chemical weapons used in Syrian fighting - watchdog",
						"desc": "Chemical weapons experts have determined that mustard gas was used during fighting in Syria in August, according to a report by an international watchdog seen by Reuters.",
						"date": 1446747372000,
						"image": "https://img-s-msn-com.akamaized.net/tenant/amp/entityid/BBmSQjO_m5_h190_w200.jpg",
						"url": "https://a.msn.com/r/2/BBmSxTl",
						"source": "Reuters"
					},
					{
						"title": "The tragic case of the boy who was missing for 13 years — and didn’t know it",
						"desc": "Julian Hernandez was abducted in Alabama by his father in 2002, police said. He was found in Ohio, living under assumed name.",
						"date": 1446746400000,
						"image": "https://img-s-msn-com.akamaized.net/tenant/amp/entityid/BBmSxnS_m5_h190_w200.jpg",
						"url": "https://a.msn.com/r/2/BBmSx48",
						"source": "The Washington Post"
					},
					{
						"title": "Rumsfeld: Bush 41 'getting up in years'",
						"desc": "The former Defense secretary is pushing back on criticism from the elder Bush.",
						"date": 1446752880000,
						"image": "https://img-s-msn-com.akamaized.net/tenant/amp/entityid/BBmSvmg_m5_h190_w200.jpg",
						"url": "https://a.msn.com/r/2/BBmSFha",
						"source": "The Hill"
					},
					{
						"title": "Russia, Egypt reject British PM's terrorist bomb speculation",
						"desc": "British Prime Minister David Cameron said Thursday there is a \"strong possibility\" a terrorist bomb brought down a Russian plane over the Sinai even as Russia and Egypt dismissed such talk as premature speculation.",
						"date": 1446746400000,
						"image": "https://img-s-msn-com.akamaized.net/tenant/amp/entityid/BBmSnRb_m5_h190_w200.jpg",
						"url": "https://a.msn.com/r/2/BBmPoS9",
						"source": "USA Today"
					},
					{
						"title": "Detective: 'Hero' cop sought hit-man to cover up thefts",
						"desc": "Months before an Illinois police officer staged his suicide to look like murder, prompting an expensive manhunt that put his community under siege, he tried to find a hit man to kill a village administrator.",
						"date": 1446750000000,
						"image": "https://img-s-msn-com.akamaized.net/tenant/amp/entityid/BBmS7SA_m5_h190_w200.jpg",
						"url": "https://a.msn.com/r/2/BBmScSG",
						"source": "Associated Press"
					}
				]
			}
		},


		/**
		 * Initialize
		 */
		initialize: function() {
			if (this.config.custom) {
				delete this.config.custom;
			}

			// Migrate pre-V2 settings to the new format
			if (["us", "uk", "ca", "fr_ca", "en_il", "fr", "au", "pt-BR_br"].indexOf(this.config.edition) !== -1) {
				var conversions = {
					us: "en-us",
					uk: "en-gb",
					ca: "en-ca",
					fr_ca: "fr-ca",
					en_il: "he-il",
					fr: "fr-fr",
					au: "en-au",
					"pt-BR_br": "pt-br"
				};

				this.config.edition = conversions[this.config.edition] || "en-us";
			}


			if (!this.config.number || this.config.number > 20) {
				this.config.number = 20;
			}

			this.authHeader = this.Auth.adFree ? "API_KEY db72b4be78c04a3a97b2b11ea8ab1e4a" : "API_KEY 8b04677e27d5498a90e306eedbf19fb3";

			this.set("activeTab", this.getTopic());

			this.on("change", function(model, options) {
				if (options && options.widgetChange === true) {
					return;
				}

				this.refresh();
			}, this);
		},

		getTopic: function(config) {
			config = config || this.config;
			if (this.isBbc(config.source)) {
				return config.bbctopic;
			}

			return config.topic;
		},

		getTopics: function(cb, source, edition) {
			if (this.isBbc(source)) {
				return this.getBbcTopics(cb);
			}

			edition = edition || this.config.edition;
			return this.getMsnTopics(cb, edition);
		},

		getStoredTopics: function() {
			if (this.isBbc()) {
				return this.bbctopics;
			}

			return this.data.topics;
		},

		isBbc: function(source) {
			source = source || this.config.source;
			return source === "bbc";
		},

		/**
		 * Loads the list of topics for the current MSN news edition.
		 *
		 * @param   {Function}  cb         The callback
		 * @param   {String}    [edition]  The edition to get topics for, defaults to the current edition
		 */
		getMsnTopics: function(cb, edition) {
			edition = edition || this.config.edition;

			$.getJSON("https://cdn.content.prod.cms.msn.com/none/sources/alias/compositestreambyname/today?market=" + edition + "&tenant=amp&vertical=news", function(d) {
				var topics = _.map(d && d._links && d._links.sources, function(d) {
					return [d.categoryKey, d.sourceName, d.href];
				});

				topics.unshift(["$allStories", this.translate("all_stories")]);

				cb.call(this, topics || []);
			}.bind(this));
		},


		/**
		 * Loads the list of topics for the current BBC news edition.
		 *
		 * @param   {Function}  cb         The callback
		 */
		getBbcTopics: function(cb) {
			var topics = this.bbctopics;
			cb.call(this, topics);
		},

		/**
		 * Parses and normalizes articles
		 *
		 * @param   {Array}   docs       The items to parse
		 * @return  {Object}             An array of parsed, normalized entries
		 */
		parseArticles: function(docs, maximized) {
			// Bing returns a relational data structure, we need to index the items
			// for fast lookups
			var images = {},
				sources = {},
				articles = [];

			_.each(docs, function(e) {
				var self = (e._links && e._links.self && e._links.self[0]) || {};

				if (self.type === "image") {
					images[self.href] = e;
				}
				else if (self.type === "provider") {
					sources[self.href] = e;
				}
				else if (self.type === "article" || self.type === "video" || self.type === "slideshow") {
					articles.push(e);
				}
			});


			var textDiv = document.createElement("div");

			articles = _.map(articles, function(e) {
				var image = _.find(e._links && e._links.references, { type: "image" });

				image = image && images[image.href] && images[image.href].href;

				textDiv.innerHTML = e.abstract || "";

				return {
					title: e.title || "",
					desc: textDiv.textContent.trim(),
					date: new Date(e.displayPublishedDateTime).getTime(),
					image: maximized ? image : (image || "").replace(".img", "_m5_h190_w200.jpg"),
					url: (((e._links && e._links.self && e._links.self[0]) || {}).href || "").replace("cms-amp-", "http://a.msn.com/r/2/"),
					source: e._links && e._links.provider && e._links.provider[0] && sources[e._links.provider[0].href] && sources[e._links.provider[0].href].displayName
				};
			});

			return articles;
		},


		refresh: function() {
			if (this.isBbc()) {
				this.refreshBbc();
				return;
			}

			this.refreshMsn();
		},

		knowDomains: [
			"www.reuters.com",
			"a.msn.com",
			"img-s-msn-com.akamaized.net",
			"img.s-msn.com"
		],

		fixlinks: function(items) {
			var fix = function(url) {
				if (!_.isEmpty(url)) {
					for (var i = 0; i < this.knowDomains.length; i++) {
						var domain = this.knowDomains[i];

						if (url.indexOf("http://" + domain) === 0) {
							return url.slice(0, 4) + "s" + url.slice(4);
						}
					}
				}

				return url;
			}.bind(this);

			if (!_.isEmpty(items))  {
				_.each(items, function(item) {
					item.url = fix(item.url);
					item.image = fix(item.image);
				});
			}
		},

		refreshMsn: function() {
			// We load the list of topics once when the page loads since it might
			// have changed since we last loaded it
			if (!this.topicsLoaded) {
				this.getTopics(function(topics) {
					this.topicsLoaded = true;

					this.data.topics = topics;

					this.refresh();
				});

				return;
			}

			// We save the active tab in case it changes before the request is finished
			var activeTab = this.get("activeTab");

			if (!this.Auth.isPro && activeTab !== this.config.topic) {
				return this.set("activeTab", this.config.topic);
			}

			var maximized = this.get("state") === "maximized";

			var topic = _.find(this.data.topics, [activeTab]);

			$.getJSON("https://cdn.content.prod.cms.msn.com/common/abstract/" + (topic[0] === "$allStories" ? "alias/compositestreambyname/today" : "id/" + topic[2]), {
				count: maximized ? 45 : this.config.number,
				market: this.config.edition,
				tenant: "amp",
				vertical: "news",
				_: new Date().getTime() //to avoid caching
			}, function(d) {
				// If the active tab has changed (i.e. the user has switched tabs
				// twice before the request finished), we don't want to emit any entries
				if (
					this.get("activeTab") === activeTab &&
					d && d._embedded && d._embedded.documents
				) {
					var items = this.parseArticles(d._embedded.documents, maximized);
					this.fixlinks(items);

					// Only save data if this is the default tab and we aren't
					// maximized (and therefore didn't fetch more articles)
					if (activeTab === this.config.topic && !maximized) {
						this.data.items = items;

						this.saveData();
					}
					else {
						// We only trigger the entries:loaded event if this is not the
						// first tab so the view doesn't render twice
						this.trigger("entries:loaded", {
							items: items
						});
					}
				}
			}.bind(this));
		},

		refreshBbc: function(isReload) {
			// We save the active tab in case it changes before the request is finished
			var activeTab = this.get("activeTab");

			if (!this.Auth.isPro && activeTab !== this.config.bbctopic) {
				return this.set("activeTab", this.config.bbctopic);
			}

			var maximized = this.get("state") === "maximized";

			var topic = _.find(this.bbctopics, [activeTab]);

			var url = "https://feeds.bbci.co.uk/news/";
			if (topic && topic.length > 2) {
				url += topic[2] + "/";
			}
			url += "rss.xml";
			if (topic && topic.length > 3) {
				url += topic[3];
			}

			var process = function(d) {
				// If the active tab has changed (i.e. the user has switched tabs
				// twice before the request finished), we don't want to emit any entries
				if (
					this.get("activeTab") === activeTab && d && d.items
				) {
					var items = _.map(d.items, this.parseFeedlyEntry, this);
					this.fixlinks(items);

					// Only save data if this is the default tab and we aren't
					// maximized (and therefore didn't fetch more articles)
					if (activeTab === this.config.bbctopic && !maximized) {
						this.data.items = items;

						this.saveData();
					}
					else {
						// We only trigger the entries:loaded event if this is not the
						// first tab so the view doesn't render twice
						this.trigger("entries:loaded", {
							items: items
						});
					}
				}
			}.bind(this);

			var getSingle = function() {
				var cached = feedlyProxy.getCached(url);
				if (cached && !isReload) {
					setTimeout(function() {
						process(cached);
					}, 0);
					return;
				}

				var cacheTimeout = 3 * 60000;

				$.getJSON("https://cloud.feedly.com/v3/streams/contents?streamId=feed%2F" + encodeURIComponent(url), {
					bnd: new Date().getTime(),
					count: maximized ? 45 : this.config.number
				}, function(d) {
					feedlyProxy.onsent(d, url, new Date().getTime() + cacheTimeout);
					process(d);
				}.bind(this)).fail(function() {
					this.trigger("entries:loaded", {
						errors: 1
					})
				});
			}.bind(this);

			var delayMs = feedlyProxy.getDelay(isReload || false);
			if (delayMs >= 0) {
				getSingle();
				return;
			}

			setTimeout(function() {
				getSingle();
			}.bind(this), delayMs);
		},


		/**
		 * Parses a feed entry, removing tracking tokens, ads, and sharing buttons
		 *
		 * @param   {Object}   e           The item to parse
		 * @param   {Boolean}  [extended]  If extended data should be parsed
		 * @return  {Object}               A parsed, normalized entry
		 */
		parseFeedlyEntry: function(e, extended) {
			extended = extended === true;

			var html = $("<div>" + ((e.summary && e.summary.content) || (e.content && e.content.content) || "")
				.replace(/ src="\/\//g, " data-src=\"https://")
				.replace(/ src="/g, " data-src=\"")
				.replace(/ src='\/\//g, " data-src='https://")
				.replace(/ src='/g, " data-src='") +
			"</div>");

			// Cleanup tracking images, feedburner ads, etc.
			_.each(html[0].querySelectorAll('.mf-viral, .feedflare, img[width="1"], img[height="1"], img[data-src^="http://da.feedsportal.com"]'), function(e) {
				if (e && e.parentNode) {
					e.parentNode.removeChild(e);
				}
			});

			var item = {
				date: e.published,
				title: (e.title || "").trim(),
				url: ((_.find(e.alternate, { type: "text/html" }) || {}).href || "").trim()
			};


			if (extended) {
				item.author = e.author;
				item.source = e.origin && e.origin.title;
			}


			if (e.visual && e.visual.url && e.visual.url !== "none") {
				item.image = e.visual.url;
			}
			else if (html.find("img[data-src]").length) {
				item.image = html.find("img[data-src]").first().attr("data-src");
			}
			else if (html.find("iframe[data-chomp-id]").length) {
				item.image = "http://img.youtube.com/vi/" + html.find("iframe[data-chomp-id]").attr("data-chomp-id") + "/1.jpg";
			}
			else if (e.enclosure && e.enclosure.length > 0 && e.enclosure[0].width && e.enclosure[0].height && e.enclosure[0].href) {
				item.image = e.enclosure[0].href;
			}

			// Find any element that isn't allowed and replace it with its contents
			_.each(html[0].querySelectorAll("*:not(a):not(b):not(i):not(strong):not(u)"), function(e) {
				if (e.children.length) {
					$(e).children().unwrap();
				}
				else {
					$(e).replaceWith(e.innerHTML);
				}
			});

			// Then remove anything that's left
			_.each(html[0].querySelectorAll("*:not(a):not(b):not(i):not(strong):not(u)"), function(e) {
				if (e && e.parentNode) {
					e.parentNode.removeChild(e);
				}
			});


			// If the first element in the description is empty or the article's
			// title repeated, remove it
			var fChild = html.children().first(),
				text = (fChild.text() || "").trim();

			if (!text || text.toLowerCase() === item.title.toLowerCase()) {
				fChild.remove();
			}


			// If the description is blank (maybe it only had an image that's now
			// been removed), remove it
			if (!html[0].innerHTML.trim().length) {
				delete item.desc;
			}

			// Otherwise, make every link nested so it can still be clicked
			else {
				_.each(html[0].querySelectorAll("a"), function(e) {
					var span = document.createElement("span");

					span.setAttribute("class", "nested-link");
					span.setAttribute("data-target", "blank");
					span.setAttribute("class", "nested-link");

					span.textContent = e.textContent.replace(/\n/g, "  ").trim();


					var href = e.getAttribute("href") || "https://www.google.com/";

					if (href.trim().indexOf("//") === 0) {
						href =  "http:" + href.trim();
					}
					else if (href.trim().indexOf("http") !== 0) {
						href =  "http://" + href.trim();
					}
					else {
						href = href.trim();
					}

					span.setAttribute("data-href", href);


					$(e).replaceWith(span);
				});

				item.desc = html[0].innerHTML.trim();
			}

			return item;
		}


	});
});
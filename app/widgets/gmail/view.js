define(["widgets/views/main"], function(WidgetView) {
	return WidgetView.extend({
		isFrame: true,


		events: {
			"click .refresh-btn": function() {
				this.model.refresh();
			},
			"click .back-btn": function() {
				this.model.setListPage();
			},
			"click .label-link": function() {
				this.model.setLabelsPage();
			},
			"click .message": function(e) {
				var id = e.currentTarget.getAttribute("data-id");
				this.model.setMessagePage(id);
			},
			"click .labels .item": function(e) {
				var id = e.currentTarget.getAttribute("data-id");
				this.model.setListPage(id);
			}
		},

		onBeforeRender: function(data) {
			var type = this.model.config.type || "api";
			if ( type === "old" ) {
				data.url = "https://mail.google.com/mail/mu/mp/?authuser=" + (this.model.config.user || 0);	
			} else if ( type === "new" ) {
				data.url = "https://mail.google.com/mail/u/" + (this.model.config.user || 0) + "/x/" + (new Date().getTime())  + "/f/?";
			} 

			data.label = this.model.config.label;

			data.page_list = this.model.isPageList() ? 1 : null;
			data.page_labels = this.model.isPageLabels() ? 1 : null;
			data.page_message = this.model.isPageMessage() ? 1 : null;

			data.labels = this.model.labels;
			data.email = this.model.email;

			return data;
		},

		onRender: function() {
			this.el.style.height = (this.model.config.height || 400) + "px";

			/***
			if (!this.model.apiAuth) {
				this.model.setOAuth();p
			}
			****/
		}
	});
});	
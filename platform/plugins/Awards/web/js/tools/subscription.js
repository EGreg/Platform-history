(function (window, Q, $, undefined) {

    /**
     * @module Awards
     */

    /**
     * YUIDoc description goes here
     * @class Awards subscription
     * @constructor
     * @param {Object} [options] Override various options for this tool
     *  @param {String} [options.publisherId] user id of the publisher of the stream
     *  @param {String} [options.streamName] the stream's name
     *  @param {Q.Event} [options.onMove] Event that fires after a move
     */

    Q.Tool.define("Awards/subscription", function (options) {
            var tool = this;
            var state = tool.state;
            var $te = $(tool.element);

            if (state.initialContent == null) {
                state.initialContent = tool.element.innerHTML
            }

            if (!Q.Users.loggedInUser) {
                tool.element.style.display = 'none';
                console.warn("Don't render tool when user is not logged in");
                return;
            }

            if (!state.publisherId || !state.streamName) {
//                throw new Q.Exception(tool.id + ": publisherId or streamName is required");
            }

            Q.Streams.get(state.publisherId, state.streamName, function () {
//                $(tool.element).text(this.fields.title);
            });

//            document.getElementById("authnetpay").onsubmit = function() {
//                console.log(this);
//                Q.Dialogs.push({
//                    title: 'pay',
//                    content:
//                    '<div class="authnetpay"></div>'
//                });
//            };

            // set up some event handlers
            this.getMyStream(function (err) {
                if (err) return;
                var stream = this;
                stream.onMove.set(function (err, message) {
                    // do something here
                }, this); // handler will be auto-removed when this tool is removed
            });

        },

        { // default options here
            publisherId: null,
            streamName: null,
            onMove: new Q.Event() // an event that the tool might trigger
        },

        { // methods go here

            /**
             * Example method for this tool
             * @method getMyStream
             * @param {Function} callback receives arguments (err) with this = stream
             */
            getMyStream: function (callback) {
                var state = this.state;
                Q.Streams.retainWith(this)
                    .get(state.publisherId, state.streamName, callback);
            }

        });

    Q.Template.set(
        'Awards/stripe',
        '<div class="{{class}}">{{& title}}</div>'
        + '<form action="/charge" method="POST">'
        + '<script'
        + 'src="https://checkout.stripe.com/checkout.js" class="stripe-button"'
        + 'data-key="pk_test_jWgB7......."'
        + 'data-image="/img/documentation/checkout/marketplace.png"'
        + 'data-name="Demo Site"'
        + 'data-description="2 widgets"'
        + 'data-amount="2000"'
        + 'data-locale="auto">'
        + '</script>'
        + '</form>'
    );

    Q.addStylesheet('plugins/Awards/css/Awards.css');

})(window, Q, jQuery);
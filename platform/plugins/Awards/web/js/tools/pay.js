(function (window, Q, $, undefined) {

    /**
     * @module Awards
     */

    /**
     * YUIDoc description goes here
     * @class Awards pay
     * @constructor
     * @param {Object} [options] Override various options for this tool
     *  @param {String} [options.publisherId] user id of the publisher of the stream
     *  @param {String} [options.streamName] the stream's name
     *  @param {Q.Event} [options.onMove] Event that fires after a move
     */

    Q.Tool.define("Awards/pay", function (options) {
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

//            Q.addStylesheet("css/Wishes.css"); // add any css you need

            document.getElementsByClassName("Awards_auth")[0].onsubmit = function() {
                Q.Dialogs.push({
                    title: '',
                    content:
                    '<iframe ' +
                    'name="authnet" ' +
                    'src="" ' +
                    'width="480" ' +
                    'height="640" ' +
                    'frameborder="0" ' +
                    'scrolling="no" ' +
                    'id="authnet" ' +
                    'class="authnet" ' +
                    '></iframe>'
                });
            };

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

/*
    Q.Template.set(
        'Awards/authorize',
        '<FORM METHOD=POST ACTION="https://test.authorize.net/gateway/transact.dll">'
        + '<% ret = InsertFP (APIloginid, sequence, amount, txnkey) %>'
        + '<INPUT TYPE=HIDDEN NAME="x_version" VALUE="3.1">'
        + '<INPUT TYPE=HIDDEN NAME="x_delim_data" VALUE="TRUE">'
        + '<INPUT TYPE=HIDDEN NAME="x_login" VALUE="99.........">'
        + '<INPUT TYPE=HIDDEN NAME="x_tran_key" VALUE="3pF............">'
        + '<INPUT TYPE=HIDDEN NAME="x_show_form" VALUE="PAYMENT_FORM">'
        + '<INPUT TYPE=HIDDEN NAME="x_method" VALUE="CC">'
        + '<INPUT TYPE=HIDDEN NAME="x_type" VALUE="AUTH_CAPTURE">'
        + '<INPUT TYPE=HIDDEN NAME="x_amount" VALUE="9.95">'
        + '<INPUT TYPE=HIDDEN NAME="x_relay_response" VALUE="FALSE">'
        + '<INPUT TYPE=SUBMIT VALUE="Click here for the secure payment form">'
        + '</FORM>'
    );
*/

/*
    Q.Template.render(
        'Awards/authorize',
'',//        fields,
        function (err, html) {
//            $(element).html(html);
        }
    );
*/

})(window, Q, jQuery);
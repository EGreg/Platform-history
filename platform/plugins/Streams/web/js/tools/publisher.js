/*
 * Streams/publisher tool
 */
Q.Tool.define("Streams/publisher", function (options) {

	var input;
	switch (options.field_type) {
		case 'textarea':
			input = $('<textarea name="foo" />');
			break;
		case 'text':
			input = $('<input type="text"> ')
			break;
	}
	$("<textarea />")
	
},

{
	"label": "",
	"placeholder": "Leave a message for {user}",
	"field_type": "textarea",
	"submit": null,
	"login_options": {
		"activate": "activate"
	}
});
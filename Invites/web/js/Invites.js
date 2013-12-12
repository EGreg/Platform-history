Q.onInit.set(function () {

}, 'Invites');

Q.Invites = {
	passwordHash: function(form) {
		var pwd = form.find('.password'), val = pwd.val();
		if (val) pwd.val(Q.md5(val));
	}
};
(function (Q, $) {

/**
 * Streams Tools
 * @module Streams-tools
 */

/**
 * Interface for selecting facebook photos from user albums
 * @class Streams inplace
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {Q.Event} [options.onSelect] This callback is called when the user selects a photo.
 *   @required
 *   @param {String} [options.uid] Optional. The uid of the user on the provider whose photos are shown. Defaults to 'me()' which is current logged in user.
 *   @param {String} [options.fetchBy] The tool supports different algoriths for fetching photos
 *   @default 'album'
 *   @param {Q.Event} [options.onLoad] Q.Event, callback or callback string name which is called when bunch of photos has been loaded.
 *   @param {Q.Event} [options.onError] Q.Event, callback or callback string which will be called for each image that is unable to load. Image DOM element will be passed as first argument.
 *   @param {String} [options.provider]  Has to be "facebook" for now. so currently there are two variants: by 'album' and by 'tags'. Maybe more will be added later.
 *   @default 'facebook'
 *   @param {String} [options.prompt]  Has to be "facebook" for now.
 *   Specifies type of prompt if user is not logged in or didn't give required permission for the tool.
 *                         Can be either 'button', 'dialog' or null|false. In first case just shows simple button which opens facebook login popup.
 *                         In second case shows Users.facebookDialog prompting user to login.
 *                         In third case will not show any prompt and will just hide the tool.
 *   @param {String} [options.promptTitle]  Used only when 'prompt' equals 'dialog' - will be title of the dialog.
 *   @param {String} [options.promptText]  Used either for button caption when 'prompt' equals 'button' or dialog text when 'prompt' equals 'dialog'.
 *   @param {Boolean} [options.oneLine]  If true, all the images are shown in a large horizontally scrolling line.
 *   @default false
 *   @param {Boolean} [options.cache]  If true, photos will be cached using localStorage (if available).
 *   @default false
 */
Q.Tool.define("Streams/photoSelector", function _Streams_chat_constructor (o) {

    if (!o.onSelect) {
        alert("Please provide the onSelect option for the photoSelector");
        return false;
    }
    if (o.provider !== 'facebook') {
        alert("Only facebook is supported as a provider for now");
        return false;
    }
    o.onSelect = new Q.Event(o.onSelect);

    var fetchBy = {

        album: function(aid, $element, callback)
        {
            var photos = (o.cache && window.localStorage && localStorage['cached_photos_' + o.uid + '_' + aid]) ?
			JSON.parse(localStorage['cached_photos_' + o.uid + '_' + aid]) : null;
            if (photos)
            {
                callback($element, photos);
                Q.handle(o.onLoad, this, [aid, photos]);
            }
            else
            {
                var fields = 'pid,src_small,caption,object_id';
                Q.handle(o.beforeAlbum, this, [aid]);
                FB.api({
                        method: 'fql.query',
                        query: 'SELECT ' + fields + ' FROM photo WHERE aid="' + aid + '"'
                }, function(photos)
                {
                    callback($element, photos);
                    Q.handle(o.onLoad, this, [aid, photos]);

                    if (o.cache && window.localStorage)
			localStorage['cached_photos_' + o.uid + '_' + aid] = JSON.stringify(photos);
                });
            }
        },

        tags: function($element, callback)
        {
            var photos = (o.cache && window.localStorage && localStorage['cached_photos_' + o.uid]) ?
			JSON.parse(localStorage['cached_photos_' + o.uid]) : null;
            if (photos)
            {
                callback($element, photos);
                Q.handle(o.onLoad, this, [photos]);
            }
            else
            {
                FB.api({
                    method: 'fql.query',
                    query: 'SELECT pid, object_id, src_small, caption FROM photo WHERE pid IN (SELECT pid FROM photo_tag WHERE subject = ' + o.uid + ')'
                }, function(photoRows)
                {
                    var photosByPid = {};
                    var pids = '';
                    for (var i = 0; i < photoRows.length; i++)
                    {
                        photosByPid[photoRows[i]['pid']] = photoRows[i];
                        photosByPid[photoRows[i]['pid']].tagsCount = 0;
                        pids += "'" + photoRows[i]['pid'] + "'" + (i < photoRows.length - 1 ? ',' : '');
                    }

                    FB.api({
                        method: 'fql.query',
                        query: 'SELECT pid FROM photo_tag WHERE pid IN (' + pids + ')'
                    }, function(tagRows)
                    {
                        var i;
                        for (i in tagRows)
                        {
                            photosByPid[tagRows[i]['pid']].tagsCount++;
                        }

                        var photos = [];
                        for (i in photosByPid)
                        {
                            if (photosByPid[i].tagsCount > 0)
                            {
                                photos.push(photosByPid[i]);
                            }
                            if (photos.length == 300)
                                break;
                        }

                        photos.sort(function(a, b)
                        {
                            if (a.tagsCount < b.tagsCount)
                                return 1;
                            else if (a.tagsCount > b.tagsCount)
                                return -1;
                            else
                                return 0;
                        });

                        callback($element, photos);

                        Q.handle(o.onLoad, this, [photos]);

                        if (o.cache && window.localStorage)
				localStorage['cached_photos_' + o.uid] = JSON.stringify(photos);
                    });
                });
            }
        }

    };

    function fetchAlbums($element)
    {
        FB.api({
                method: 'fql.query',
                query: 'SELECT aid, name, visible, object_id FROM album WHERE owner=' + o.uid
        }, function(response)
        {
            showAlbums($element, response);
            fetchPhotos($element);
        });
    }

    function showAlbums($element, albums)
    {
        var select = $('<select class="Streams_photoSelector_albums" />').bind('change keydown input', function()
        {
            fetchPhotos($element);
        });
        $element.empty().append(select);
        for (var i in albums)
        {
            select.append($('<option />', {value: albums[i].aid}).html(albums[i].name));
        }
    }

    function fetchPhotos($element)
    {
        switch (o.fetchBy)
        {
            case 'album':
                fetchBy.album($element.find('.Streams_photoSelector_albums').val(), $element, showPhotos);
                break;
            case 'tags':
                fetchBy.tags($element, showPhotos);
                break;
            default:
                break;
        }
    }

    function showPhotos($element, photos)
    {
        if (o.fetchBy == 'tags')
            $element.empty();
        var photosContainer = $element.find('.Streams_photoSelector_container');
        if (!photosContainer.length)
        {
            photosContainer = $('<div class="Streams_photoSelector_container" />');
            $element.append(photosContainer);
        }

        photosContainer.empty();

        switch (o.fetchBy)
        {
            case 'album':
                if (!$element.find('.Streams_photoSelector_tool_title').length)
                    $element.find('.Streams_photoSelector_albums').before('<div class="Streams_photoSelector_tool_title">Select an album:</div>');
		break;
            case 'tags':
                if (!$element.find('.Streams_photoSelector_tool_title').length)
                    $element.find('.Streams_photoSelector_container').before('<div class="Streams_photoSelector_tool_title">Select photo from Facebook:</div>');
		break;
            default:
		break;
        }

        if (photos.length > 0)
        {
            var photoData = {};
            var totalWidth = 0;
            for (var i in photos)
            {
                var img = $('<img />', {
                    src: photos[i].src_small,
                    alt: photos[i].caption,
                    "class": "Streams_photoSelector_photo",
                    "data-pid": photos[i].pid
                });
                img.bind('error', function()
                {
                    Q.handle(o.onError, this, [this]);
                });
                photosContainer.append(img);
                totalWidth += parseInt(img.width());
                if (!isNaN(parseInt(img.css('margin-left')))) {
                    totalWidth += parseInt(img.css('margin-left'));
                }
                if (!isNaN(parseInt(img.css('margin-right')))) {
                    totalWidth += parseInt(img.css('margin-right'));
                }
                photoData[photos[i].pid] = photos[i];
            }
            if (o.oneLine)
            {
                scrollBarHeight = 50;
                photosContainer.width(totalWidth);
                $element.find('.Streams_photoSelector_container').height(photos.height() + scrollBarHeight)
                         .css({overflow: "hidden", "overflow-x": "auto"});
            }
            $('img', photosContainer).click(function()
            {
                if (o.onSelect) {
                    Q.handle(o.onSelect, this, [photoData[$(this).attr('data-pid')]]);
                }
                return false;
            });
        }
        else
        {
            photosContainer.append('<div class="Streams_photoSelector_no_photos">No photos found for these criteria.</div>');
        }
    }

    function onSuccessfulLogin($element)
    {
        FB.api('/me/permissions', function (response)
        {
            var needFriends = (o.uid != 'me()' && o.uid != Q.plugins.Users.loggedInUser.fb_uid);
            if ( response.data && response.data.length && response.data[0].user_photos &&
                     (!needFriends || (needFriends && response.data[0].friends_photos)) )
            {
                switch (o.fetchBy)
                {
                    case 'album': fetchAlbums($element); break;
                    case 'tags': fetchPhotos($element); break;
		    default: break;
                }
            }
            else
            {
                Q.plugins.Users.facebookDialog({
                    'title': 'Permissions request',
                    'content': 'The application requires access to your ' + (needFriends ? 'your friends photos.' : 'photos.'),
                    'buttons': [
                        {
                            'label': 'Grant permissions',
                            'handler': function(dialog)
                            {
                                Q.plugins.Users.login({
                                    using: 'facebook',
                                    scope: needFriends ? 'user_photos,friends_photos' : 'user_photos',
                                    onCancel: function()
                                    {
                                        dialog.close();
                                        $element.empty();
                                    },
                                    onSuccess: function()
                                    {
                                        dialog.close();
                                        switch (o.fetchBy)
                                        {
                                            case 'album': fetchAlbums($element); break;
                                            case 'tags': fetchPhotos($element); break;
                                            default: break;
                                        }
                                    }
                                });
                            },
                            'default': true
                        },
                        {
                            'label': 'Cancel',
                            'handler': function(dialog)
                            {
                                $element.empty();
                                dialog.close();
                            }
                        }
                    ],
                    'position': null,
                    'shadow': true
                });
            }
        });
    }

        var $element = $(this.element);
        switch (o.provider)
        {
            case 'facebook':
                $element.find('*').remove();
                $element.removeClass('Streams_photoSelector_by_album Streams_photoSelector_by_tags')
                         .addClass('Streams_photoSelector_by_' + o.fetchBy);
                $element.append('<div class="Streams_tools_throbber"><img src="' + Q.info.proxyBaseUrl +
                                         '/plugins/Q/img/throbbers/loading.gif" alt="" /></div>');
                Q.plugins.Users.login({
                    tryQuietly: true,
                    using: 'facebook',
                    scope: 'user_photos',
                    onSuccess: function()
                    {
                        onSuccessfulLogin($element);
                    },
                    onCancel: function()
                    {
                        // we may show the dialog asking user to login
                        if (o.prompt == 'dialog')
                        {
                            Q.plugins.Users.facebookDialog({
                                'title': o.promptTitle,
                                'content': o.promptText,
                                'buttons': [
                                    {
                                        'label': 'Login',
                                        'handler': function(dialog)
                                        {
                                            Q.plugins.Users.login(
                                            {
                                                using: 'facebook',
                                                onCancel: function()
                                                {
                                                    dialog.close();
                                                    $element.hide();
                                                },
                                                onSuccess: function()
                                                {
                                                    dialog.close();
                                                    onSuccessfulLogin($element);
                                                }
                                            });
                                        },
                                        'default': true
                                    },
                                    {
                                        'label': 'Cancel',
                                        'handler': function(dialog)
                                        {
                                            $element.hide();
                                            dialog.close();
                                        }
                                    }
                                ],
                                'position': null,
                                'shadow': true
                            });
                        }
                        // or a button, clicking on it will cause facebook login popup to appear
                        else if (o.prompt == 'button')
                        {
                            var button = $('<button class="Q_main_button">' + o.promptText + '</button>');
                            $element.empty().append(button);
                            button.click(function()
                            {
                                Q.plugins.Users.login(
                                {
                                    using: 'facebook',
                                    onSuccess: function()
                                    {
                                        onSuccessfulLogin($element);
                                    }
                                });
                            });
                        }
                        // or just hide photo selector
                        else
                        {
                            $element.hide();
                            Q.plugins.Users.onLogin.set(function()
                            {
                                Q.plugins.Users.onLogin.remove('photo-selector-login');
                                $element.show();
                                onSuccessfulLogin($element);
                            }, 'photo-selector-login');
                        }
                    }
                });
            break;
        }
},

{
    onSelect: null,
    uid: 'me()',
    fetchBy: 'album',
    onLoad: new Q.Event(function() {}),
    onError: new Q.Event(function() {}),
    provider: 'facebook',
    prompt: false,
    promptTitle: 'Login required',
    promptText: 'Please log into Facebook to to view photos.',
    oneLine: false,
    cache: false
}

);

})(Q, jQuery);
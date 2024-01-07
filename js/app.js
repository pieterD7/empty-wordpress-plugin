(function(){

    function setCursorReady(){
        document.querySelector( 'body' ).classList.remove( 'wcagme-busy' )
    }

    function setCursorBusy( ){
        if( ! document.querySelector( 'body' ).classList.contains( 'wcagme-busy' ) )
            document.querySelector( 'body' ).classList.add( 'wcagme-busy' )
    }

    function removeAudioIDFromPost( postID ){
        return new Promise( ( resolve, reject ) => {
            fetch( wcagme_data.rest_url + 'audio/remove/' + postID, { 
                method: 'POST', 
                headers: {"Content-Type": "application/x-www-form-urlencoded", "X-WP-Nonce": wcagme_data.nonce }, 
            })
            .catch( reject )
            .then( resolve )
        })
    }

    function setAudioID( postID, audioID){
        return new Promise( ( resolve, reject ) => {
            fetch( wcagme_data.rest_url + 'audio/save/' + postID + '/' + audioID, { 
                method: 'POST', 
                headers: {"Content-Type": "application/x-www-form-urlencoded", "X-WP-Nonce": wcagme_data.nonce }, 
            })
            .catch( reject )
            .then( resolve )
        })
    }

    function initGallery(){
        var Library = wp.media.controller.Library,
            Select = wp.media.view.MediaFrame.Select,
            l10n = wp.media.view.l10n
            
        return Select.extend({
            
            initialize: function() {
                this.counts = {
                    audio: {
                        count: wp.media.view.settings.attachmentCounts.audio,
                        state: 'playlist'
                    },
                    video: {
                        count: wp.media.view.settings.attachmentCounts.video,
                        state: 'video-playlist'
                    }
                };
        
                _.defaults( this.options, {
                    multiple:  true,
                    editing:   false,
                    state:    'insert',
                    metadata:  {}
                });
        
                // Call 'initialize' directly on the parent class.
                Select.prototype.initialize.apply( this, arguments );
                this.createIframeStates();
            }, 

            /**
                 * Create the default states.
                 */
            createStates: function() {
                var options = this.options;

                this.states.add([

                    new Library({
                        id:         'insert',
                        title:      wp.media.view.l10n.audioAddSourceTitle,
                        priority:   20,
                        toolbar:    'main-insert',
                        filterable: 'uploaded',
                        searchable: true,
                        sortable:   true,
                        describe:   true,
                        multiple:   false,
                        editable:   true,
                        library:  wp.media.query( _.defaults({
                            // Adding a new query parameter
                            'wcagme-audio': 'wcagme-audio',
                            type: 'audio'
        
                        }, options.library ) ), 
                         
                        // Show the attachment display settings.
                        displaySettings: true,
                        // Update user settings when users adjust the
                        // attachment display settings.
                        displayUserSettings: true
                    }), 

                    // Embed states.
                    //new wp.media.controller.Embed( { metadata: options.metadata } ),
                   
                    new Library({
                        id:         'playlist',
                        title:      l10n.createPlaylistTitle,
                        priority:   60,
                        toolbar:    'main-playlist',
                        filterable: 'uploaded',
                        multiple:   'add',
                        editable:   false,
        
                        library:  wp.media.query( _.defaults({
                            type: 'audio'
                        }, options.library ) )
                    }),
        
                    // Playlist states.
                    new wp.media.controller.CollectionEdit({
                        type: 'audio',
                        collectionType: 'playlist',
                        title:          l10n.editPlaylistTitle,
                        SettingsView:   wp.media.view.Settings.Playlist,
                        library:        options.selection,
                        editing:        options.editing,
                        menu:           'playlist',
                        dragInfoText:   l10n.playlistDragInfo,
                        dragInfo:       false
                    }),

                    new wp.media.controller.CollectionAdd({
                        type: 'audio',
                        collectionType: 'playlist',
                        title: l10n.addToPlaylistTitle
                    }),

                ]);

                if ( wp.media.view.settings.post.featuredImageId ) {
                    this.states.add( new wp.media.controller.FeaturedImage() );
                }
            },

            bindHandlers: function() {
                var handlers, checkCounts;

                Select.prototype.bindHandlers.apply( this, arguments );

                this.on( 'activate', this.activate, this );

                // Only bother checking media type counts if one of the counts is zero.
                checkCounts = _.find( this.counts, function( type ) {
                    return type.count === 0;
                } );

                if ( typeof checkCounts !== 'undefined' ) {
                    this.listenTo( wp.media.model.Attachments.all, 'change:type', this.mediaTypeCounts );
                }

                this.on( 'menu:create:gallery', this.createMenu, this );
                this.on( 'menu:create:playlist', this.createMenu, this );
                this.on( 'menu:create:video-playlist', this.createMenu, this );
                this.on( 'toolbar:create:main-insert', this.createToolbar, this );
                this.on( 'toolbar:create:main-gallery', this.createToolbar, this );
                this.on( 'toolbar:create:main-playlist', this.createToolbar, this );
                this.on( 'toolbar:create:main-video-playlist', this.createToolbar, this );
                this.on( 'toolbar:create:featured-image', this.featuredImageToolbar, this );
                this.on( 'toolbar:create:main-embed', this.mainEmbedToolbar, this );

                handlers = {
                    menu: {
                        'default': 'mainMenu',
                        'gallery': 'galleryMenu',
                        'playlist': 'playlistMenu',
                        'video-playlist': 'videoPlaylistMenu'
                    },

                    content: {
                        'embed':          'embedContent',
                        'edit-image':     'editImageContent',
                        'edit-selection': 'editSelectionContent'
                    },

                    toolbar: {
                        'main-insert':      'mainInsertToolbar',
                        'main-gallery':     'mainGalleryToolbar',
                        'gallery-edit':     'galleryEditToolbar',
                        'gallery-add':      'galleryAddToolbar',
                        'main-playlist':    'mainPlaylistToolbar',
                        'playlist-edit':    'playlistEditToolbar',
                        'playlist-add':        'playlistAddToolbar',
                        'main-video-playlist': 'mainVideoPlaylistToolbar',
                        'video-playlist-edit': 'videoPlaylistEditToolbar',
                        'video-playlist-add': 'videoPlaylistAddToolbar'
                    }
                };

                _.each( handlers, function( regionHandlers, region ) {
                    _.each( regionHandlers, function( callback, handler ) {
                        this.on( region + ':render:' + handler, this[ callback ], this );
                    }, this );
                }, this );
            },

            activate: function() {
                // Hide menu items for states tied to particular media types if there are no items.
                _.each( this.counts, function( type ) {
                    if ( type.count < 1 ) {
                        this.menuItemVisibility( type.state, 'hide' );
                    }
                }, this );
            },

            mediaTypeCounts: function( model, attr ) {
                if ( typeof this.counts[ attr ] !== 'undefined' && this.counts[ attr ].count < 1 ) {
                    this.counts[ attr ].count++;
                    this.menuItemVisibility( this.counts[ attr ].state, 'show' );
                }
            },

            // Menus.
            /**
             * @param {wp.Backbone.View} view
             */
            mainMenu: function( view ) {
                view.set({
                    'library-separator': new wp.media.View({
                        className:  'separator',
                        priority:   100,
                        attributes: {
                            role: 'presentation'
                        }
                    })
                });
            },

            menuItemVisibility: function( state, visibility ) {
                var menu = this.menu.get();
                if ( visibility === 'hide' ) {
                    menu.hide( state );
                } else if ( visibility === 'show' ) {
                    menu.show( state );
                }
            },
            /**
             * @param {wp.Backbone.View} view
             */
            galleryMenu: function( view ) {
                var lastState = this.lastState(),
                    previous = lastState && lastState.id,
                    frame = this;

                view.set({
                    cancel: {
                        text:     l10n.cancelGalleryTitle,
                        priority: 20,
                        click:    function() {
                            if ( previous ) {
                                frame.setState( previous );
                            } else {
                                frame.close();
                            }

                            // Move focus to the modal after canceling a Gallery.
                            this.controller.modal.focusManager.focus();
                        }
                    },
                    separateCancel: new wp.media.View({
                        className: 'separator',
                        priority: 40
                    })
                });
            },

            playlistMenu: function( view ) {
                var lastState = this.lastState(),
                    previous = lastState && lastState.id,
                    frame = this;

                view.set({
                    cancel: {
                        text:     l10n.cancelPlaylistTitle,
                        priority: 20,
                        click:    function() {
                            if ( previous ) {
                                frame.setState( previous );
                            } else {
                                frame.close();
                            }

                            // Move focus to the modal after canceling an Audio Playlist.
                            this.controller.modal.focusManager.focus();
                        }
                    },
                    separateCancel: new wp.media.View({
                        className: 'separator',
                        priority: 40
                    })
                });
            },

            videoPlaylistMenu: function( view ) {
                var lastState = this.lastState(),
                    previous = lastState && lastState.id,
                    frame = this;

                view.set({
                    cancel: {
                        text:     l10n.cancelVideoPlaylistTitle,
                        priority: 20,
                        click:    function() {
                            if ( previous ) {
                                frame.setState( previous );
                            } else {
                                frame.close();
                            }

                            // Move focus to the modal after canceling a Video Playlist.
                            this.controller.modal.focusManager.focus();
                        }
                    },
                    separateCancel: new wp.media.View({
                        className: 'separator',
                        priority: 40
                    })
                });
            },

            // Content.
            embedContent: function() {
                var view = new wp.media.view.Embed({
                    controller: this,
                    model:      this.state()
                }).render();

                this.content.set( view );
            },

            editSelectionContent: function() {
                var state = this.state(),
                    selection = state.get('selection'),
                    view;

                view = new wp.media.view.AttachmentsBrowser({
                    controller: this,
                    collection: selection,
                    selection:  selection,
                    model:      state,
                    sortable:   true,
                    search:     false,
                    date:       false,
                    dragInfo:   true,

                    AttachmentView: wp.media.view.Attachments.EditSelection
                }).render();

                view.toolbar.set( 'backToLibrary', {
                    text:     l10n.returnToLibrary,
                    priority: -100,

                    click: function() {
                        this.controller.content.mode('browse');
                        // Move focus to the modal when jumping back from Edit Selection to Add Media view.
                        this.controller.modal.focusManager.focus();
                    }
                });

                // Browse our library of attachments.
                this.content.set( view );

                // Trigger the controller to set focus.
                this.trigger( 'edit:selection', this );
            },

            editImageContent: function() {
                var image = this.state().get('image'),
                    view = new wp.media.view.EditImage( { model: image, controller: this } ).render();

                this.content.set( view );

                // After creating the wrapper view, load the actual editor via an Ajax call.
                view.loadEditor();

            },

            // Toolbars.

            /**
             * @param {wp.Backbone.View} view
             */
            selectionStatusToolbar: function( view ) {
                var editable = this.state().get('editable');

                view.set( 'selection', new wp.media.view.Selection({
                    controller: this,
                    collection: this.state().get('selection'),
                    priority:   -40,

                    // If the selection is editable, pass the callback to
                    // switch the content mode.
                    editable: editable && function() {
                        this.controller.content.mode('edit-selection');
                    }
                }).render() );
            },

            /**
             * @param {wp.Backbone.View} view
             */
            mainInsertToolbar: function( view ) {
                var controller = this;

                this.selectionStatusToolbar( view );

                view.set( 'insert', {
                    style:    'primary',
                    priority: 80,
                    text:     l10n.insertIntoPost,
                    requires: { selection: true },

                    /**
                     * @ignore
                     *
                     * @fires wp.media.controller.State#insert
                     */
                    click: function() {
                        var state = controller.state(),
                            selection = state.get('selection');

                        controller.close();
                        state.trigger( 'insert', selection ).reset();
                    }
                });
            },

            /**
             * @param {wp.Backbone.View} view
             */
            mainGalleryToolbar: function( view ) {
                var controller = this;

                this.selectionStatusToolbar( view );

                view.set( 'gallery', {
                    style:    'primary',
                    text:     l10n.createNewGallery,
                    priority: 60,
                    requires: { selection: true },

                    click: function() {
                        var selection = controller.state().get('selection'),
                            edit = controller.state('gallery-edit'),
                            models = selection.where({ type: 'image' });

                        edit.set( 'library', new wp.media.model.Selection( models, {
                            props:    selection.props.toJSON(),
                            multiple: true
                        }) );

                        // Jump to Edit Gallery view.
                        this.controller.setState( 'gallery-edit' );

                        // Move focus to the modal after jumping to Edit Gallery view.
                        this.controller.modal.focusManager.focus();
                    }
                });
            },

            mainPlaylistToolbar: function( view ) {
                var controller = this;

                this.selectionStatusToolbar( view );

                view.set( 'playlist', {
                    style:    'primary',
                    text:     l10n.createNewPlaylist,
                    priority: 100,
                    requires: { selection: true },

                    click: function() {
                        var selection = controller.state().get('selection'),
                            edit = controller.state('playlist-edit'),
                            models = selection.where({ type: 'audio' });

                        edit.set( 'library', new wp.media.model.Selection( models, {
                            props:    selection.props.toJSON(),
                            multiple: true
                        }) );

                        // Jump to Edit Audio Playlist view.
                        this.controller.setState( 'playlist-edit' );

                        // Move focus to the modal after jumping to Edit Audio Playlist view.
                        this.controller.modal.focusManager.focus();
                    }
                });
            },

            mainVideoPlaylistToolbar: function( view ) {
                var controller = this;

                this.selectionStatusToolbar( view );

                view.set( 'video-playlist', {
                    style:    'primary',
                    text:     l10n.createNewVideoPlaylist,
                    priority: 100,
                    requires: { selection: true },

                    click: function() {
                        var selection = controller.state().get('selection'),
                            edit = controller.state('video-playlist-edit'),
                            models = selection.where({ type: 'video' });

                        edit.set( 'library', new wp.media.model.Selection( models, {
                            props:    selection.props.toJSON(),
                            multiple: true
                        }) );

                        // Jump to Edit Video Playlist view.
                        this.controller.setState( 'video-playlist-edit' );

                        // Move focus to the modal after jumping to Edit Video Playlist view.
                        this.controller.modal.focusManager.focus();
                    }
                });
            },

            featuredImageToolbar: function( toolbar ) {
                this.createSelectToolbar( toolbar, {
                    text:  l10n.setFeaturedImage,
                    state: this.options.state
                });
            },

            mainEmbedToolbar: function( toolbar ) {
                toolbar.view = new wp.media.view.Toolbar.Embed({
                    controller: this
                });
            },

            galleryEditToolbar: function() {
                var editing = this.state().get('editing');
                this.toolbar.set( new wp.media.view.Toolbar({
                    controller: this,
                    items: {
                        insert: {
                            style:    'primary',
                            text:     editing ? l10n.updateGallery : l10n.insertGallery,
                            priority: 80,
                            requires: { library: true },

                            /**
                             * @fires wp.media.controller.State#update
                             */
                            click: function() {
                                var controller = this.controller,
                                    state = controller.state();

                                controller.close();
                                state.trigger( 'update', state.get('library') );

                                // Restore and reset the default state.
                                controller.setState( controller.options.state );
                                controller.reset();
                            }
                        }
                    }
                }) );
            },

            galleryAddToolbar: function() {
                this.toolbar.set( new wp.media.view.Toolbar({
                    controller: this,
                    items: {
                        insert: {
                            style:    'primary',
                            text:     l10n.addToGallery,
                            priority: 80,
                            requires: { selection: true },

                            /**
                             * @fires wp.media.controller.State#reset
                             */
                            click: function() {
                                var controller = this.controller,
                                    state = controller.state(),
                                    edit = controller.state('gallery-edit');

                                edit.get('library').add( state.get('selection').models );
                                state.trigger('reset');
                                controller.setState('gallery-edit');
                                // Move focus to the modal when jumping back from Add to Gallery to Edit Gallery view.
                                this.controller.modal.focusManager.focus();
                            }
                        }
                    }
                }) );
            },

            playlistEditToolbar: function() {
                var editing = this.state().get('editing');
                this.toolbar.set( new wp.media.view.Toolbar({
                    controller: this,
                    items: {
                        insert: {
                            style:    'primary',
                            text:     editing ? l10n.updatePlaylist : l10n.insertPlaylist,
                            priority: 80,
                            requires: { library: true },

                            /**
                            * @fires wp.media.controller.State#update
                            */
                            click: function() {
                                var controller = this.controller,
                                    state = controller.state();

                                controller.close();
                                state.trigger( 'update', state.get('library') );

                                // Restore and reset the default state.
                                controller.setState( controller.options.state );
                                controller.reset();
                            }
                        }
                    }
                }) );
            },

            playlistAddToolbar: function() {
                this.toolbar.set( new wp.media.view.Toolbar({
                    controller: this,
                    items: {
                        insert: {
                            style:    'primary',
                            text:     l10n.addToPlaylist,
                            priority: 80,
                            requires: { selection: true },

                            /**
                            * @fires wp.media.controller.State#reset
                            */
                            click: function() {
                                var controller = this.controller,
                                    state = controller.state(),
                                    edit = controller.state('playlist-edit');

                                edit.get('library').add( state.get('selection').models );
                                state.trigger('reset');
                                controller.setState('playlist-edit');
                                // Move focus to the modal when jumping back from Add to Audio Playlist to Edit Audio Playlist view.
                                this.controller.modal.focusManager.focus();
                            }
                        }
                    }
                }) );
            },

            videoPlaylistEditToolbar: function() {
                var editing = this.state().get('editing');
                this.toolbar.set( new wp.media.view.Toolbar({
                    controller: this,
                    items: {
                        insert: {
                            style:    'primary',
                            text:     editing ? l10n.updateVideoPlaylist : l10n.insertVideoPlaylist,
                            priority: 140,
                            requires: { library: true },

                            click: function() {
                                var controller = this.controller,
                                    state = controller.state(),
                                    library = state.get('library');

                                library.type = 'video';

                                controller.close();
                                state.trigger( 'update', library );

                                // Restore and reset the default state.
                                controller.setState( controller.options.state );
                                controller.reset();
                            }
                        }
                    }
                }) );
            },

            videoPlaylistAddToolbar: function() {
                this.toolbar.set( new wp.media.view.Toolbar({
                    controller: this,
                    items: {
                        insert: {
                            style:    'primary',
                            text:     l10n.addToVideoPlaylist,
                            priority: 140,
                            requires: { selection: true },

                            click: function() {
                                var controller = this.controller,
                                    state = controller.state(),
                                    edit = controller.state('video-playlist-edit');

                                edit.get('library').add( state.get('selection').models );
                                state.trigger('reset');
                                controller.setState('video-playlist-edit');
                                // Move focus to the modal when jumping back from Add to Video Playlist to Edit Video Playlist view.
                                this.controller.modal.focusManager.focus();
                            }
                        }
                    }
                }) );
            }

        });
    }

    function insertHandler(el, frame){
        var postID = el.getAttribute( 'rel' ),
            sel = frame.state().get('selection'),
            obj = sel ? sel.first() : null

        if(postID && obj){
            setCursorBusy()
            setAudioID( postID, obj.id )
            .then( () => {
                attachAudio( el,  obj )
            })
            .catch( console.log )
            .then( setCursorReady )
        }
        else console.log("Error")
    }

    function showImageSelector( el ){

        var customFrame = initGallery()

        var frame = new customFrame();

        frame.on( 'insert', () => { insertHandler(el, frame) });
        frame.on( 'update', () => { insertHandler(el, frame) });

        frame.on( 'close', () => {
        } )

        frame.on( 'open', () => {
            setCursorReady()
        } )
    
        frame.open();

        //frame.setState('wcagme-audio')

        frame.activateMode('select')
    }

    function removeAudio( el ){
        var e = el.querySelector('.attach-audio')
        if( e ){
            el.classList.toggle( 'hasAudio' )
        }
    }

    function attachAudio( el, obj ){
        var e = el.querySelector('.remove-audio')
        if(e){
            el.classList.toggle( 'hasAudio' )
            e.setAttribute( 'title', obj.id)
        }
    }

    function initButton(){
        var el1 = document.querySelectorAll( '.attach-audio' ),
            el2 = document.querySelectorAll( '.remove-audio' );

        if( el1 ){

            el1.forEach( ( el ) => {
            
                el.addEventListener( 'click', ( event ) => {
                    setCursorBusy()
                    new Promise( () => {
                        showImageSelector( el.closest( 'audio-attachment' ) )
                        event.stopPropagation()
                        event.preventDefault()
                    })
                } )
            })

            el2.forEach( ( el ) => {
                el.addEventListener( 'click', ( event ) => {
                    var _el = el.closest( 'audio-attachment' ),
                        postID = '';
                    if(_el)
                        postID = _el.getAttribute( 'rel' )
                    if( postID ){
                        setCursorBusy()
                        removeAudioIDFromPost( postID )
                        .catch( () => { console.log(); event.stopPropagation(); } )
                        .then( () => { removeAudio( _el ) } )
                        .then( () => { event.stopPropagation(); setCursorReady() } )
                    }
                })
            })
        } 
    }

    addEventListener("DOMContentLoaded", () => {
        initButton();
    })

})()
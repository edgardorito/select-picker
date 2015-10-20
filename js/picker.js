"use strict";

// TODO : Events fireing or callback implementation
// TODO : Add support for sorting
// TODO : Tests

(function( $, window, document, undefined ){
    var Picker = function( elem, options ){
        this.elem = elem;
        this.$elem = $(elem);
        this.options = options;
        this.currentData = [];
    };

    Picker.prototype = {
        defaults: {
            multiple: undefined,
            containerClass: '',
            containerWidth: false,
            width: false,
            search: false,
            searchAutofocus: false,
            autofocusScrollOffset: 0,
            coloring: {},
            texts: {
                trigger : "Select value",
                noResult : "No results",
                search : "Search"
            }
        },

        config: {},

        init: function() {
            this.config = $.extend({}, this.defaults, this.options);

            if(this.config.multiple === undefined) {
                this.config.multiple = this.$elem.is("select[multiple='multiple']") || this.$elem.is("select[multiple]");
            }

            if(!this.$elem.is("select")){
                console.log("Picker - Element is not Selectbox");
                return;
            }

            if(this.config.width !== false
                && (Math.floor(this.config.width) != this.config.width || !$.isNumeric(this.config.width))){
                console.log("Picker - Width is not a integer.");
                return;
            }

            if(this.config.containerWidth !== false
                && (Math.floor(this.config.containerWidth) != this.config.containerWidth || !$.isNumeric(this.config.containerWidth))){
                console.log("Picker - Container width is not a integer.");
                return;
            }

            this._build();
            this.$elem.css('display', 'none');

            this._fillList();

            this.$container.find('.pc-trigger').click(function(){
                var list = this.$container.find('.pc-list');
                list.toggle();

                if(this.config.search && this.config.searchAutofocus){
                    if (list.is(':visible')) {
                        list.find('input').focus();
                        $('html, body').animate({
                            scrollTop: list.find('input').offset().top - this.config.autofocusScrollOffset
                        }, 800);
                    }
                }
            }.bind(this));

            $(document).mouseup(function (e)
                {
                    var pc_list = this.$container.find(".pc-list");
                    if (!pc_list.is(e.target) && pc_list.has(e.target).length === 0 && !this.$container.find(".pc-trigger").is(e.target))
                    {
                        pc_list.hide();

                        if(this.config.search){
                            this.$container.find(".pc-list input").val('');
                            this._updateList(this.currentData);
                        }
                    }

                }.bind(this));

            return this;
        },

        pc_selected: function(e){
            var $elem = $(e.target);
            var selectedId = $elem.data('id');
            this._selectElement(selectedId, $elem);

            this.$container.find(".pc-list").hide();

            if(this.config.search){
                this.$container.find(".pc-list input").val('');
                this._updateList(this.currentData);
            }
        },

        pc_remove: function(elem){
            var $elem = $(elem.target);
            var selectedId = $elem.parent().data('id');
            var order = $elem.parent().data('order');

            var li = $("<li>").html($elem.parent().text()).attr('data-id', selectedId).attr('data-order', order);
            li.click(this.pc_selected.bind(this));


            if(this.config.search) {
                this._insertIntoCurrentData(elem);
            }

            var currentList = this.$container.find('.pc-list li');
            if(!this.$container.find(".pc-trigger").is(':visible')) { // Empty list
                this.$container.find('.pc-list ul').html('').append(li);
                this.$container.find(".pc-trigger").show();
            }else if(currentList.size() == 1) { // Only one item in list
                if(order > currentList.data('order')){
                    li.insertAfter(currentList);
                }else{
                    li.insertBefore(currentList);
                }
            }else{
                currentList.each(function(i,e) {
                    e = $(e);
                    if(e.is(':first-child')){
                        if(order < e.data('order')){
                            li.insertBefore(e);
                            return false;
                        }else if(order > e.data('order')
                            && order < e.next().data('order')){
                            li.insertAfter(e);
                            return false;
                        }
                    }else if(e.is(':last-child')) {
                        if(order > e.data('order')){
                            li.insertAfter(e);
                            return false;
                        }
                    }else{
                        if(order > e.data('order')
                            && order < e.next().data('order')){
                            li.insertAfter(e);
                            return false;
                        }
                    }
                });
            }
            this.$elem.find(" option[value='" + selectedId + "']").removeAttr("selected");
            $elem.parent().remove();
        },

        pc_search: function(e){
            var searchedValue = $(e.target).val().toLowerCase();
            var filteredData = this._filterData(searchedValue);
            this._updateList(filteredData, searchedValue);
        },

        ////////////////////////////////////////////
        ////////////// Private methods//////////////
        ////////////////////////////////////////////

        _selectElement: function (id, $elem) {
            if($elem == undefined){
                $elem = this.$container.find('.pc-list li[data-id="' + id + '"]');

                if($elem.length == 0){
                    console.log('Picker - ID to select not found!');
                    return;
                }
            }

            if(this.config.multiple) {
                this.$container.prepend(this._createElement($elem));
                $elem.remove();

                if(this.config.search){
                    this.currentData = this.currentData.filter(function (value) {
                        return value.id != id;
                    });
                }

                if(this.$container.find(".pc-list li").size() == 0) {
                    this.$container.find(".pc-trigger").hide();
                }
            }else{
                this.$elem.find("option").removeAttr("selected");

                if (this.config.coloring[id]) {
                    this.$container.find(".pc-trigger").removeClass().addClass(this.config.coloring[selectedId] + " pc-trigger pc-element").contents().first().replaceWith($elem.text());
                } else {
                    this.$container.find(".pc-trigger").contents().first().replaceWith($elem.text());
                }
            }

            this.$elem.find("option[value='" + id + "']").attr("selected", "selected");

        },

        _insertIntoCurrentData: function (elem) {
            var $elem = $(elem.target);
            var selectedId = $elem.parent().data('id');
            var order = $elem.parent().data('order');

            if(this.currentData.length == 0){
                this.currentData = [{
                    'id': selectedId,
                    'text': $elem.parent().text(),
                    'order': order
                }];

                return;
            }

            var i;
            for (i = 0; i < this.currentData.length; i++) {
                if (i == 0) {
                    if(order < this.currentData[i].order || this.currentData.length == 1){
                        this.currentData.splice(0, 0, {
                            'id': selectedId,
                            'text': $elem.parent().text(),
                            'order': order
                        });
                        break;
                    }
                } else if (i == (this.currentData.length - 1)) {
                    if(order > this.currentData[i].order){
                        this.currentData.splice(i, 0, {
                            'id': selectedId,
                            'text': $elem.parent().text(),
                            'order': order
                        });
                        break;
                    }
                } else if (this.currentData[i - 1].order < order && order < this.currentData[i].order) {
                    this.currentData.splice(i, 0, {
                        'id': selectedId,
                        'text': $elem.parent().text(),
                        'order': order
                    });
                    break;
                }
            }
        },

        _createElement: function($elem){
            var tagClass = this.config.coloring[$elem.data('id')];
            var root = $("<span>").addClass("pc-element " + (tagClass ? tagClass : "")).text($elem.text())
                .attr('data-id', $elem.data('id')).attr('data-order',$elem.data('order'));

            root.append($('<span class="pc-close"></span>').click(this.pc_remove.bind(this)));
            return root;
        },

        _build: function(){
            var triggerText;
            if(this.config.multiple){
                triggerText = this.config.texts.trigger;
            }else{
                triggerText = this.$elem.find('option').first().text();
            }

            this.$container = $("<div class='picker" + (this.config.containerClass ? ' ' + this.config.containerClass : '') + "'>" +
            "<span class='pc-select'>" +
            "<span class='pc-element pc-trigger'>" + triggerText + "</span>" +
            "<span class='pc-list' " + ( this.config.width ? "style='width:" + this.config.width + "px;'" : "") + "><ul></ul></span>" +
            "</span>" +
            "</div>");

            if(this.config.containerWidth !== false){
                this.$container.width(this.config.containerWidth);
            }

            this.$container.insertAfter(this.$elem);

            if(this.config.search){
                this._buildSearch();
            }
        },

        _buildSearch : function () {
            var $searchField = $("<input type='search' placeholder='" + this.config.texts.search + "'>");
            $searchField.on('input', this.pc_search.bind(this));
            $searchField.on('keypress', function (e) {
                if(e.which == 13){
                    var searchedValue = $(e.target).val().toLowerCase();
                    var filteredData = this._filterData(searchedValue);

                    if(filteredData.length == 1){
                        this.$container.find('.pc-list li').first().click();
                        return false;
                    }
                }

                return true;
            }.bind(this));

            this.$container.find('.pc-list').prepend($searchField);
        },

        _fillList: function(){
            var listContainer = this.$container.find('.pc-list ul');
            var counter = 0;
            this.$elem.find('option:not([hidden])').each(function(index, elem){
                var li = $("<li>").html($(elem).text()).attr('data-id', $(elem).attr('value')).attr('data-order', counter);
                li.click(this.pc_selected.bind(this));
                listContainer.append(li);

                if(this.config.search){
                    this.currentData.push({
                        'id' : $(elem).attr('value'),
                        'text' : $(elem).text(),
                        'order' : counter
                    });
                }


                if($(elem).attr('selected') == 'selected'){
                    li.click();
                }

                counter++;
            }.bind(this));

            this.$container.find(".pc-trigger").show();
        },

        _filterData: function (searchedValue) {
            return this.currentData.filter(function (value) {
                return value.text.toLowerCase().indexOf(searchedValue) != -1;
            });
        },

        _updateList: function(filteredData, searchedValue){
            var listContainer = this.$container.find('.pc-list ul');
            if(filteredData.length == 0){
                listContainer.html('<li class="not-found">' + this.config.texts.noResult + '</li>');
                return;
            }

            listContainer.html('');
            var i, liContent;
            for(i = 0; i < filteredData.length; i++){
                // Highlighting searched string
                if(searchedValue !== undefined){
                    var regex = new RegExp( '(' + searchedValue + ')', 'gi' );
                    liContent = filteredData[i].text.replace( regex, '<span class="searched">$1</span>' )
                }else{
                    liContent = filteredData[i].text;
                }

                var li = $("<li>").html(liContent).attr('data-id', filteredData[i].id).attr('data-order', filteredData[i].order);
                li.click(this.pc_selected.bind(this));
                listContainer.append(li);
            }
        },

        /////////////////////////////////
        ////////////// API //////////////
        /////////////////////////////////

        // API invocation
        api: function (args) {
            if(Picker.prototype['api_' + args[0]]){
                return this['api_' + args[0]](args.slice(1));
            }else{
                console.log('Picker - unknown command!');
            }
        },

        // API functions

        api_destroy : function () {
            this.$container.remove();
            this.$elem.show();
            this.$elem.removeData("plugin_picker");

            return this.$elem;
        },

        api_get : function () {
            return this.$elem.val();
        },

        api_set : function (args) {
            if(args.length != 1){
                console.log('Picker - unknown number of arguments');
                return;
            }

            this._selectElement(args[0]);

            return this.$elem;
        }
    };

    $.fn.picker = function(options) {
        var instance = $(this).data("plugin_picker");
        if (!instance) {
            $(this).data("plugin_picker", new Picker(this, options).init());
            return this;
        } else {
            return instance.api(Array.prototype.slice.call(arguments));
        }
    };


})( jQuery, window , document );
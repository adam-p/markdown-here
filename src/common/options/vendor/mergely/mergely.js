/**
 * Copyright (c) 2013 by Jamie Peabody, http://www.mergely.com
 * All rights reserved.
 * Version: 3.3.2 2013-06-13
 */
Mgly = {};

Mgly.Timer = function(){
	var self = this;
	self.start = function() { self.t0 = new Date().getTime(); }
	self.stop = function() {
		var t1 = new Date().getTime();
		var d = t1 - self.t0; 
		self.t0 = t1;
		return d;
	}
	self.start();
}

Mgly.ChangeExpression = new RegExp(/(\d+(?:,\d+)?)([acd])(\d+(?:,\d+)?)/);

Mgly.DiffParser = function(diff) {
	var changes = [];
	var change_id = 0;
	// parse diff
	var diff_lines = diff.split(/\n/);
	for (var i = 0; i < diff_lines.length; ++i) {
		if (diff_lines[i].length == 0) continue;
		var change = {};
		var test = Mgly.ChangeExpression.exec(diff_lines[i]);
		if (test == null) continue;
		// lines are zero-based
		var fr = test[1].split(',');
		change['lhs-line-from'] = fr[0] - 1;
		if (fr.length == 1) change['lhs-line-to'] = fr[0] - 1;
		else change['lhs-line-to'] = fr[1] - 1;
		var to = test[3].split(',');
		change['rhs-line-from'] = to[0] - 1;
		if (to.length == 1) change['rhs-line-to'] = to[0] - 1;
		else change['rhs-line-to'] = to[1] - 1;
		// TODO: optimize for changes that are adds/removes
		if (change['lhs-line-from'] < 0) change['lhs-line-from'] = 0;
		if (change['lhs-line-to'] < 0) change['lhs-line-to'] = 0;
		if (change['rhs-line-from'] < 0) change['rhs-line-from'] = 0;
		if (change['rhs-line-to'] < 0) change['rhs-line-to'] = 0;
		change['op'] = test[2];
		changes[change_id++] = change;
	}
	return changes;
}

Mgly.sizeOf = function(obj) {
	var size = 0, key;
	for (key in obj) {
		if (obj.hasOwnProperty(key)) size++;
	}
	return size;
}

Mgly.LCS = function(x, y) {
	this.x = x.replace(/ /g, '\n');
	this.y = y.replace(/ /g, '\n');
}
jQuery.extend(Mgly.LCS.prototype, {
	clear: function() { this.ready = 0; },
	diff: function(added, removed) {
		var d = new Mgly.diff(this.x, this.y, retain_lines = true, ignore_ws = false);
		var changes = Mgly.DiffParser(d.normal_form());
		var li = 0, ri = 0, lj = 0, rj = 0, r0 = 0, l0 = 0;
		for (var i = 0; i < changes.length; ++i) {
			var change = changes[i];
			
			// find the starting index of the line
			li += d.lhs_lines.slice(lj, change['lhs-line-from']).join(' ').length;
			// if the starting index is more than last time, add 1 (space)
			if (li > l0) li += 1;
			// get the index of the the span of the change
			lj = change['lhs-line-to'] + 1;
			// get the changed text
			var lchange = d.lhs_lines.slice(change['lhs-line-from'], lj).join(' ');
			// output the changed index and text
			removed(li, li + lchange.length);
			// increment the starting index beyond the last change
			li += lchange.length + 1;
			// remember last index
			l0 = li;

			// find the starting index of the line
			ri += d.rhs_lines.slice(rj, change['rhs-line-from']).join(' ').length;
			// if the starting index is more than last time, add 1 (space)
			if (ri > r0) ri += 1;
			// get the index of the the span of the change
			rj = change['rhs-line-to'] + 1;
			// get the changed text
			var rchange = d.rhs_lines.slice(change['rhs-line-from'], rj).join(' ');
			// output the changed index and text
			added(ri, ri + rchange.length);
			// increment the starting index beyond the last change
			ri += rchange.length + 1;
			// remember last index
			r0 = ri;
		}
	}
});
Mgly.diff = function(lhs, rhs, retain_lines, ignore_ws) {
	this.diff_codes = {};
	this.max_code = 0;
	var lhs_lines = lhs.split('\n');
	var rhs_lines = rhs.split('\n');
	if (lhs.length == 0) lhs_lines = [];
	if (rhs.length == 0) rhs_lines = [];
	
	var lhs_data = new Object();
	lhs_data.data = this._diff_codes(lhs_lines, ignore_ws);
	lhs_data.modified = {};
	lhs_data.length = Mgly.sizeOf(lhs_data.data);

	var rhs_data = new Object();
	rhs_data.data = this._diff_codes(rhs_lines, ignore_ws);
	rhs_data.modified = {};
	rhs_data.length = Mgly.sizeOf(rhs_data.data);
	
	var max = (lhs_data.length + rhs_data.length + 1);
	var vector_d = Array( 2 * max + 2 );
	var vector_u = Array( 2 * max + 2 );
	
	this._lcs(lhs_data, 0, lhs_data.length, rhs_data, 0, rhs_data.length, vector_u, vector_d);
	this._optimize(lhs_data);
	this._optimize(rhs_data);
	this.items = this._create_diffs(lhs_data, rhs_data);
	if (retain_lines) {
		this.lhs_lines = lhs_lines;
		this.rhs_lines = rhs_lines;
	}
};
jQuery.extend(Mgly.diff.prototype, {
	changes: function() { return this.items; },
	normal_form: function() {
		var nf = '';
		for (var index = 0; index < this.items.length; ++index) {
			var item = this.items[index];
			var lhs_str = '';
			var rhs_str = '';
			var change = 'c';
			if (item.lhs_deleted_count == 0 && item.rhs_inserted_count > 0) change = 'a';
			else if (item.lhs_deleted_count > 0 && item.rhs_inserted_count == 0) change = 'd';
			
			if (item.lhs_deleted_count == 1) lhs_str = item.lhs_start + 1;
			else if (item.lhs_deleted_count == 0) lhs_str = item.lhs_start;
			else lhs_str = (item.lhs_start + 1) + ',' + (item.lhs_start + item.lhs_deleted_count);
			
			if (item.rhs_inserted_count == 1) rhs_str = item.rhs_start + 1;
			else if (item.rhs_inserted_count == 0) rhs_str = item.rhs_start;
			else rhs_str = (item.rhs_start + 1) + ',' + (item.rhs_start + item.rhs_inserted_count);
			nf += lhs_str + change + rhs_str + '\n';
			if (this.rhs_lines && this.lhs_lines) {
				// if rhs/lhs lines have been retained, output contextual diff
				for (var i = item.lhs_start; i < item.lhs_start + item.lhs_deleted_count; ++i) {
					nf += '< ' + this.lhs_lines[i] + '\n';
				}
				if (item.rhs_inserted_count && item.lhs_deleted_count) nf += '---\n';
				for (var i = item.rhs_start; i < item.rhs_start + item.rhs_inserted_count; ++i) {
					nf += '> ' + this.rhs_lines[i] + '\n';
				}
			}
		}
		return nf;
	},
	_diff_codes: function(lines, ignore_ws) {
		var code = this.max_code;
		var codes = {};
		for (var i = 0; i < lines.length; ++i) {
			var line = lines[i];
			if (ignore_ws) {
				line = line.replace(/\s+/g, '');
			}
			var aCode = this.diff_codes[line];
			if (aCode != undefined) {
				codes[i] = aCode;
			}
			else {
				this.max_code++;
				this.diff_codes[line] = this.max_code;
				codes[i] = this.max_code;
			}
		}
		return codes;
	},
	_lcs: function(lhs, lhs_lower, lhs_upper, rhs, rhs_lower, rhs_upper, vector_u, vector_d) {
		while ( (lhs_lower < lhs_upper) && (rhs_lower < rhs_upper) && (lhs.data[lhs_lower] == rhs.data[rhs_lower]) ) {
			++lhs_lower;
			++rhs_lower;
		}
		while ( (lhs_lower < lhs_upper) && (rhs_lower < rhs_upper) && (lhs.data[lhs_upper - 1] == rhs.data[rhs_upper - 1]) ) {
			--lhs_upper;
			--rhs_upper;
		}
		if (lhs_lower == lhs_upper) {
			while (rhs_lower < rhs_upper) {
				rhs.modified[ rhs_lower++ ] = true;
			}
		}
		else if (rhs_lower == rhs_upper) {
			while (lhs_lower < lhs_upper) {
				lhs.modified[ lhs_lower++ ] = true;
			}
		}
		else {
			var sms = this._sms(lhs, lhs_lower, lhs_upper, rhs, rhs_lower, rhs_upper, vector_u, vector_d);
			this._lcs(lhs, lhs_lower, sms.x, rhs, rhs_lower, sms.y, vector_u, vector_d);
			this._lcs(lhs, sms.x, lhs_upper, rhs, sms.y, rhs_upper, vector_u, vector_d);
		}
	},
	_sms: function(lhs, lhs_lower, lhs_upper, rhs, rhs_lower, rhs_upper, vector_u, vector_d) {
		var max = lhs.length + rhs.length + 1;
		var kdown = lhs_lower - rhs_lower;
		var kup = lhs_upper - rhs_upper;
		var delta = (lhs_upper - lhs_lower) - (rhs_upper - rhs_lower);
		var odd = (delta & 1) != 0;
		var offset_down = max - kdown;
		var offset_up = max - kup;
		var maxd = ((lhs_upper - lhs_lower + rhs_upper - rhs_lower) / 2) + 1;
		vector_d[ offset_down + kdown + 1 ] = lhs_lower;
		vector_u[ offset_up + kup - 1 ] = lhs_upper;
		var ret = {x:0,y:0};
		for (var d = 0; d <= maxd; ++d) {
			for (var k = kdown - d; k <= kdown + d; k += 2) {
				var x, y;
				if (k == kdown - d) {
					x = vector_d[ offset_down + k + 1 ];//down
				}
				else {
					x = vector_d[ offset_down + k - 1 ] + 1;//right
					if ((k < (kdown + d)) && (vector_d[ offset_down + k + 1 ] >= x)) {
						x = vector_d[ offset_down + k + 1 ];//down
					}
				}
				y = x - k;
				// find the end of the furthest reaching forward D-path in diagonal k.
				while ((x < lhs_upper) && (y < rhs_upper) && (lhs.data[x] == rhs.data[y])) {
					x++; y++;
				}
				vector_d[ offset_down + k ] = x;
				// overlap ?
				if (odd && (kup - d < k) && (k < kup + d)) {
					if (vector_u[offset_up + k] <= vector_d[offset_down + k]) {
						ret.x = vector_d[offset_down + k];
						ret.y = vector_d[offset_down + k] - k;
						return (ret);
					}
				}
			}
			// Extend the reverse path.
			for (var k = kup - d; k <= kup + d; k += 2) {
				// find the only or better starting point
				var x, y;
				if (k == kup + d) {
					x = vector_u[offset_up + k - 1]; // up
				} else {
					x = vector_u[offset_up + k + 1] - 1; // left
					if ((k > kup - d) && (vector_u[offset_up + k - 1] < x))
						x = vector_u[offset_up + k - 1]; // up
				}
				y = x - k;
				while ((x > lhs_lower) && (y > rhs_lower) && (lhs.data[x - 1] == rhs.data[y - 1])) {
					// diagonal
					x--;
					y--;
				}
				vector_u[offset_up + k] = x;
				// overlap ?
				if (!odd && (kdown - d <= k) && (k <= kdown + d)) {
					if (vector_u[offset_up + k] <= vector_d[offset_down + k]) {
						ret.x = vector_d[offset_down + k];
						ret.y = vector_d[offset_down + k] - k;
						return (ret);
					}
				}
			}
		}
		throw "the algorithm should never come here.";
	},
	_optimize: function(data) {
		var start = 0, end = 0;
		while (start < data.length) {
			while ((start < data.length) && (data.modified[start] == undefined || data.modified[start] == false)) {
				start++;
			}
			end = start;
			while ((end < data.length) && (data.modified[end] == true)) {
				end++;
			}
			if ((end < data.length) && (data.data[start] == data.data[end])) {
				data.modified[start] = false;
				data.modified[end] = true;
			}
			else {
				start = end;
			}
		}
	},
	_create_diffs: function(lhs_data, rhs_data) {
		var items = [];
		var lhs_start = 0, rhs_start = 0;
		var lhs_line = 0, rhs_line = 0;

		while (lhs_line < lhs_data.length || rhs_line < rhs_data.length) {
			if ((lhs_line < lhs_data.length) && (!lhs_data.modified[lhs_line])
				&& (rhs_line < rhs_data.length) && (!rhs_data.modified[rhs_line])) {
				// equal lines
				lhs_line++;
				rhs_line++;
			}
			else {
				// maybe deleted and/or inserted lines
				lhs_start = lhs_line;
				rhs_start = rhs_line;

				while (lhs_line < lhs_data.length && (rhs_line >= rhs_data.length || lhs_data.modified[lhs_line]))
					lhs_line++;

				while (rhs_line < rhs_data.length && (lhs_line >= lhs_data.length || rhs_data.modified[rhs_line]))
					rhs_line++;

				if ((lhs_start < lhs_line) || (rhs_start < rhs_line)) {
					// store a new difference-item
					var aItem = new Object();
					aItem.lhs_start = lhs_start;
					aItem.rhs_start = rhs_start;
					aItem.lhs_deleted_count = lhs_line - lhs_start;
					aItem.rhs_inserted_count = rhs_line - rhs_start;
					items.push(aItem);
				}
			}
		}
		return items;
	}
});

Mgly.mergely = function(el, options) {
	CodeMirror.defineExtension('centerOnCursor', function() {
		var coords = this.cursorCoords(null, 'local');
		this.scrollTo(null, 
			(coords.y + coords.yBot) / 2 - (this.getScrollerElement().clientHeight / 2));
	});

	if (el) {
		this.init(el, options);
	}
};

jQuery.extend(Mgly.mergely.prototype, {
	name: 'mergely',
	//http://jupiterjs.com/news/writing-the-perfect-jquery-plugin
	init: function(el, options) {
		this.settings = {
			autoupdate: true,
			autoresize: true,
			rhs_margin: 'right',
			lcs: true,
			sidebar: true,
			viewport: false,
			ignorews: false,
			fadein: 'fast',
			editor_width: '400px',
			editor_height: '400px',
			resize_timeout: 500,
			change_timeout: 150,
			fgcolor: {a:'#4ba3fa',c:'#a3a3a3',d:'#ff7f7f'},
			bgcolor: '#eee',
			vpcolor: 'rgba(0, 0, 200, 0.5)',
			lhs: function(setValue) { },
			rhs: function(setValue) { },
			loaded: function() { },
			//_auto_height: function(h) { return h - 20; },
			_auto_width: function(w) { return w; },
			resize: function() {
				var w = jQuery(el).parent().width();
				if (this.width == 'auto') {
					w = this._auto_width(w);
				}
				else {
					w = this.width;
					this.editor_width = w;
				}
				if (this.height == 'auto') {
					//h = this._auto_height(h);
					h = jQuery(el).parent().height();
				}
				else {
					h = this.height;
					this.editor_height = h;
				}
				var content_width = w / 2.0 - 2 * 8 - 8;
				var content_height = h;
				var self = jQuery(el);
				self.find('.mergely-column').css({ 'width': content_width + 'px' });
				self.find('.mergely-column, .mergely-canvas, .mergely-margin, .mergely-column textarea, .CodeMirror-scroll, .cm-s-default').css({ 'height': content_height + 'px' });
				self.find('.mergely-canvas').css({ 'height': content_height + 'px' });
				self.find('.mergely-column textarea').css({ 'width': content_width + 'px' });
				self.css({ width: w, height: h, clear: 'both' });
				if (self.css('display') == 'none') {
					if (this.fadein != false) self.fadeIn(this.fadein);
					else self.show();
					if (this.loaded) this.loaded();
				}
				if (this.resized) this.resized();
			},
			_debug: 'change', //scroll,draw,calc,diff,markup,change
			resized: function() { }
		};
		var cmsettings = {
			mode: 'text/plain',
			readOnly: false,
			lineWrapping: false,
			lineNumbers: true,
			gutters: ['merge', 'CodeMirror-linenumbers']
		}
		this.lhs_cmsettings = {};
		this.rhs_cmsettings = {};
		
		// save this element for faster queries
		this.element = jQuery(el);
		
		// save options if there are any
		if (options && options.cmsettings) jQuery.extend(this.lhs_cmsettings, cmsettings, options.cmsettings, options.lhs_cmsettings);
		if (options && options.cmsettings) jQuery.extend(this.rhs_cmsettings, cmsettings, options.cmsettings, options.rhs_cmsettings);
		if (options) jQuery.extend(this.settings, options);
		
		// bind if the element is destroyed
		this.element.bind('destroyed', jQuery.proxy(this.teardown, this));

		// save this instance in jQuery data
		jQuery.data(el, this.name, this);

		this._setup(el);
	},
	// bind events to this instance's methods
	bind: function() {
		var rhstx = jQuery('#' + this.id + '-rhs').get(0);
		if (!rhstx) {
			console.error('rhs textarea not defined - Mergely not initialized properly');
			return;
		}
		var lhstx = jQuery('#' + this.id + '-lhs').get(0);
		if (!rhstx) {
			console.error('lhs textarea not defined - Mergely not initialized properly');
			return;
		}
		var self = this;
		this.editor = [];
		
		this.editor[this.id + '-lhs'] = CodeMirror.fromTextArea(lhstx, this.lhs_cmsettings);
		this.editor[this.id + '-rhs'] = CodeMirror.fromTextArea(rhstx, this.rhs_cmsettings);
		this.editor[this.id + '-lhs'].on('change', function(){ if (self.settings.autoupdate) self._changing(self.id + '-lhs', self.id + '-rhs'); });
		this.editor[this.id + '-lhs'].on('scroll', function(){ self._scrolling(self.id + '-lhs'); });
		this.editor[this.id + '-rhs'].on('change', function(){ if (self.settings.autoupdate) self._changing(self.id + '-lhs', self.id + '-rhs'); });
		this.editor[this.id + '-rhs'].on('scroll', function(){ self._scrolling(self.id + '-rhs'); });
		
		// resize
		if (this.settings.autoresize) {
			var sz_timeout1 = null;
			var sz = function() {
				//self.em_height = null; //recalculate
				if (self.settings.resize) self.settings.resize();
				self.editor[self.id + '-lhs'].refresh();
				self.editor[self.id + '-rhs'].refresh();
				self._changing(self.id + '-lhs', self.id + '-rhs');
			}
			jQuery(window).resize(
				function () {
					if (sz_timeout1) clearTimeout(sz_timeout1);
					sz_timeout1 = setTimeout(sz, self.settings.resize_timeout);
				}
			);
			sz();
		}
	},
	unbind: function() {
		if (this.changed_timeout != null) clearTimeout(this.changed_timeout);
		this.editor[this.id + '-lhs'].toTextArea();
		this.editor[this.id + '-rhs'].toTextArea();
	},
	destroy: function() {
		this.element.unbind('destroyed', this.teardown);
		this.teardown();
	},
	teardown: function() {
		this.unbind();
	},
	lhs: function(text) {
		this.editor[this.id + '-lhs'].setValue(text);
	},
	rhs: function(text) {
		this.editor[this.id + '-rhs'].setValue(text);
	},
	update: function() {
		this._changing(this.id + '-lhs', this.id + '-rhs');
	},
	unmarkup: function() {
		this._clear();
	},
	scrollTo: function(side, num) {
		var le = this.editor[this.id + '-lhs'];
		var re = this.editor[this.id + '-rhs'];
		if (side == 'lhs') {
			le.setCursor(num);
			le.centerOnCursor();
		}
		else {
			re.setCursor(num);
			re.centerOnCursor();
		}
	},
	options: function(opts) {
		if (opts) {
			jQuery.extend(this.settings, opts);
			if (this.settings.autoresize) {			
				this.resize();
			}
		}
		else {
			return this.settings;
		}
	},
	swap: function() {
		if (this.lhs_cmsettings.readOnly || this.rhs_cmsettings.readOnly) return;
		var le = this.editor[this.id + '-lhs'];
		var re = this.editor[this.id + '-rhs'];
		var tmp = re.getValue();
		re.setValue(le.getValue());
		le.setValue(tmp);
	},
	merge: function(side) {
		var le = this.editor[this.id + '-lhs'];
		var re = this.editor[this.id + '-rhs'];
		if (side == 'lhs' && !this.lhs_cmsettings.readOnly) le.setValue(re.getValue());
		else if (!this.rhs_cmsettings.readOnly) re.setValue(le.getValue());
	},
	get: function(side) {
		var ed = this.editor[this.id + '-' + side];
		var t = ed.getValue();
		if (t == undefined) return '';
		return t;
	},
	clear: function(side) {
		if (side == 'lhs' && this.lhs_cmsettings.readOnly) return;
		if (side == 'rhs' && this.rhs_cmsettings.readOnly) return;
		var ed = this.editor[this.id + '-' + side];
		ed.setValue('');
	},
	cm: function(side) {
		return this.editor[this.id + '-' + side];
	},
	search: function(side, query) {
		var le = this.editor[this.id + '-lhs'];
		var re = this.editor[this.id + '-rhs'];
		var editor;
		if (side == 'lhs') editor = le;
		else editor = re;
		if ((editor.getSelection().length == 0) || (this.prev_query[side] != query)) {
			this.cursor[this.id] = editor.getSearchCursor(query, { line: 0, ch: 0 }, false);
			this.prev_query[side] = query;
		}
		if (this.cursor[this.id].findNext()) {
			editor.setSelection(this.cursor[this.id].from(), this.cursor[this.id].to());
		}
		else {
			this.cursor[this.id] = editor.getSearchCursor(query, { line: 0, ch: 0 }, false);
		}
	},
	resize: function() {
		this.settings.resize();
		this._changing(this.id + '-lhs', this.id + '-rhs');
	},
	diff: function() {
		var lhs = this.editor[this.id + '-lhs'].getValue();
		var rhs = this.editor[this.id + '-rhs'].getValue();
		var d = new Mgly.diff(lhs, rhs, retain_lines = true, ignore_ws = this.settings.ignorews);
		return d.normal_form();
	},
	_setup: function(el) {
		jQuery(this.element).hide();//hide
		this.id = jQuery(el).attr('id');
		var height = this.settings.editor_height;
		var width = this.settings.editor_width;
		this.changed_timeout = null;
		this.chfns = {};
		this.chfns[this.id + '-lhs'] = [];
		this.chfns[this.id + '-rhs'] = [];
		this.prev_query = [];
		this.cursor = [];
		this._skipscroll = {};
		this.change_exp = new RegExp(/(\d+(?:,\d+)?)([acd])(\d+(?:,\d+)?)/);
		var merge_lhs_button;
		var merge_rhs_button;
		if (jQuery.button != undefined) {
			//jquery ui
			merge_lhs_button = '<button title="Merge left"></button>';
			merge_rhs_button = '<button title="Merge right"></button>';
		}
		else {
			// homebrew
			var style = 'opacity:0.4;width:10px;height:15px;background-color:#888;cursor:pointer;text-align:center;color:#eee;border:1px solid: #222;margin-right:5px;';
			merge_lhs_button = '<div style="' + style + '" title="Merge left">&lt;</div>';
			merge_rhs_button = '<div style="' + style + '" title="Merge right">&gt;</div>';
		}
		this.merge_rhs_button = jQuery(merge_rhs_button);
		this.merge_lhs_button = jQuery(merge_lhs_button);
		
		// create the textarea and canvas elements
		jQuery(this.element).append(jQuery('<div class="mergely-margin" style="height: ' + height + '"><canvas id="' + this.id + '-lhs-margin" width="8px" height="' + height + '"></canvas></div>'));
		jQuery(this.element).append(jQuery('<div style="width:' + width + '; height:' + height + '" id="' + this.id + '-editor-lhs" class="mergely-column"><textarea style="" id="' + this.id + '-lhs"></textarea></div>'));
		jQuery(this.element).append(jQuery('<div class="mergely-canvas" style="height: ' + height + '"><canvas id="' + this.id + '-lhs-' + this.id + '-rhs-canvas" style="width:28px" width="28px" height="' + height + '"></canvas></div>'));
		var rmargin = jQuery('<div class="mergely-margin" style="height: ' + height + '"><canvas id="' + this.id + '-rhs-margin" width="8px" height="' + height + '"></canvas></div>');
		if (this.settings.rhs_margin == 'left') {
			jQuery(this.element).append(rmargin);
		}
		jQuery(this.element).append(jQuery('<div style="width:' + width + '; height:' + height + '" id="' + this.id + '-editor-rhs" class="mergely-column"><textarea style="" id="' + this.id + '-rhs"></textarea></div>'));
		if (this.settings.rhs_margin != 'left') {
			jQuery(this.element).append(rmargin);
		}
		//codemirror
		var cmstyle = '#' + this.id + ' .CodeMirror-gutter-text { padding: 5px 0 0 0; }' +
			'#' + this.id + ' .CodeMirror-lines pre, ' + '#' + this.id + ' .CodeMirror-gutter-text pre { line-height: 18px; }' +
			'.CodeMirror-linewidget { overflow: hidden; };';
		if (this.settings.autoresize) {
			cmstyle += this.id + ' .CodeMirror-scroll { height: 100%; overflow: auto; }';
		}
		jQuery('<style type="text/css">' + cmstyle + '</style>').appendTo('head');
		this.bind();
		if (this.settings.lhs) {
			var setv = this.editor[this.id + '-lhs'].getDoc().setValue;
			this.settings.lhs(setv.bind(this.editor[this.id + '-lhs'].getDoc()));
		}
		if (this.settings.rhs) {
			var setv = this.editor[this.id + '-rhs'].getDoc().setValue;
			this.settings.rhs(setv.bind(this.editor[this.id + '-rhs'].getDoc()));
		}
		
		// resize only after bind
		this.settings.resize();
	},
	
	_scrolling: function(editor_name) {
		if (this._skipscroll[editor_name] === true) {
			// scrolling one side causes the other to event - ignore it
			this._skipscroll[editor_name] = false;
			return;
		}
		var scroller = jQuery(this.editor[editor_name].getScrollerElement());
		if (this.midway == undefined) {
			this.midway = (scroller.height() / 2.0 + scroller.offset().top).toFixed(2);
		}
		// balance-line
		var midline = this.editor[editor_name].coordsChar({left:0, top:this.midway});
		var top_to = scroller.scrollTop();
		var left_to = scroller.scrollLeft();
		
		this.trace('scroll', 'side', editor_name);
		this.trace('scroll', 'midway', this.midway);
		this.trace('scroll', 'midline', midline);
		this.trace('scroll', 'top_to', top_to);
		this.trace('scroll', 'left_to', left_to);
		
		var editor_name1 = this.id + '-lhs';
		var editor_name2 = this.id + '-rhs';
		
		for (var name in this.editor) {
			if (!this.editor.hasOwnProperty(name)) continue;
			if (editor_name == name) continue; //same editor
			var this_side = editor_name.replace(this.id + '-', '');
			var other_side = name.replace(this.id + '-', '');
			var top_adjust = 0;
			
			// find the last change that is less than or within the midway point
			// do not move the rhs until the lhs end point is >= the rhs end point.
			var last_change = null;
			var force_scroll = false;
			for (var i = 0; i < this.changes.length; ++i) {
				var change = this.changes[i];
				if ((midline.line >= change[this_side+'-line-from'])) {
					last_change = change;
					if (midline.line >= last_change[this_side+'-line-to']) {
						if (!change.hasOwnProperty(this_side+'-y-start') ||
							!change.hasOwnProperty(this_side+'-y-end') ||
							!change.hasOwnProperty(other_side+'-y-start') ||
							!change.hasOwnProperty(other_side+'-y-end')){
							// change outside of viewport
							force_scroll = true;
						}
						else {
							top_adjust += 
								(change[this_side+'-y-end'] - change[this_side+'-y-start']) - 
								(change[other_side+'-y-end'] - change[other_side+'-y-start']);
						}
					}
				}
			}
			
			var vp = this.editor[name].getViewport();
			var scroll = true;
			if (last_change) {
				this.trace('scroll', 'last change before midline', last_change);
				if (midline.line >= vp.from && midline <= vp.to) {
					scroll = false;
				}
			}
			this.trace('scroll', 'scroll', scroll);
			if (scroll || force_scroll) {
				// scroll the other side
				this.trace('scroll', 'scrolling other side', top_to - top_adjust);
				var scroller = jQuery(this.editor[name].getScrollerElement());
				this._skipscroll[name] = true;//disable next event
				scroller.scrollTop(top_to - top_adjust).scrollLeft(left_to);
			}
			else this.trace('scroll', 'not scrolling other side');
			
			var timer = new Mgly.Timer();
			this._calculate_offsets(editor_name1, editor_name2, this.changes);
			this.trace('change', 'offsets time', timer.stop());
			this._markup_changes(editor_name1, editor_name2, this.changes);
			this.trace('change', 'markup time', timer.stop());
			this._draw_diff(editor_name1, editor_name2, this.changes);
			this.trace('change', 'draw time', timer.stop());
			
			this.trace('scroll', 'scrolled');
		}
	},
	_changing: function(editor_name1, editor_name2) {
		this.trace('change', 'changing-timeout', this.changed_timeout);
		var self = this;
		if (this.changed_timeout != null) clearTimeout(this.changed_timeout);
		this.changed_timeout = setTimeout(function(){
			var timer = new Mgly.Timer();
			self._changed(editor_name1, editor_name2);
			self.trace('change', 'total time', timer.stop());
		}, this.settings.change_timeout);
	},
	_changed: function(editor_name1, editor_name2) {
		this._clear();
		this._diff(editor_name1, editor_name2);
	},
	_clear: function() {
		var self = this;
		for (var name in this.editor) {
			if (!this.editor.hasOwnProperty(name)) continue;
			var editor = this.editor[name];
			var fns = self.chfns[name];
			// clear editor changes
			editor.operation(function() {
				var timer = new Mgly.Timer();
				for (var i = 0, l = editor.lineCount(); i < l; ++i) {
					editor.removeLineClass(i, 'background');
				}
				for (var i = 0; i < fns.length; ++i) {
					//var edid = editor.getDoc().id;
					var change = fns[i];
					//if (change.doc.id != edid) continue;
					if (change.lines.length) {
						self.trace('change', 'clear text', change.lines[0].text);
					}
					change.clear();
				}
				editor.clearGutter('merge');
				self.trace('change', 'clear time', timer.stop());
			});
		}
		self.chfns[name] = [];
		
		var ex = this._draw_info(this.id + '-lhs', this.id + '-rhs');
		var ctx_lhs = ex.clhs.get(0).getContext('2d');
		var ctx_rhs = ex.crhs.get(0).getContext('2d');
		var ctx = ex.dcanvas.getContext('2d');
		
		ctx_lhs.beginPath();
		ctx_lhs.fillStyle = this.settings.bgcolor;
		ctx_lhs.strokeStyle = '#888';
		ctx_lhs.fillRect(0, 0, 6.5, ex.visible_page_height);
		ctx_lhs.strokeRect(0, 0, 6.5, ex.visible_page_height);

		ctx_rhs.beginPath();
		ctx_rhs.fillStyle = this.settings.bgcolor;
		ctx_rhs.strokeStyle = '#888';
		ctx_rhs.fillRect(0, 0, 6.5, ex.visible_page_height);
		ctx_rhs.strokeRect(0, 0, 6.5, ex.visible_page_height);
		
		ctx.beginPath();
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, this.draw_mid_width, ex.visible_page_height);
	},
	_diff: function(editor_name1, editor_name2) {
		var lhs = this.editor[editor_name1].getValue();
		var rhs = this.editor[editor_name2].getValue();
		var timer = new Mgly.Timer();
		var d = new Mgly.diff(lhs, rhs, false, this.settings.ignorews);
		this.trace('change', 'diff time', timer.stop());
		this.changes = Mgly.DiffParser(d.normal_form());
		this.trace('change', 'parse time', timer.stop());
		this._calculate_offsets(editor_name1, editor_name2, this.changes);
		this.trace('change', 'offsets time', timer.stop());
		this._markup_changes(editor_name1, editor_name2, this.changes);
		this.trace('change', 'markup time', timer.stop());
		this._draw_diff(editor_name1, editor_name2, this.changes);
		this.trace('change', 'draw time', timer.stop());
	},
	_parse_diff: function (editor_name1, editor_name2, diff) {
		this.trace('diff', 'diff results:\n', diff);
		var changes = [];
		var change_id = 0;
		// parse diff
		var diff_lines = diff.split(/\n/);
		for (var i = 0; i < diff_lines.length; ++i) {
			if (diff_lines[i].length == 0) continue;
			var change = {};
			var test = this.change_exp.exec(diff_lines[i]);
			if (test == null) continue;
			// lines are zero-based
			var fr = test[1].split(',');
			change['lhs-line-from'] = fr[0] - 1;
			if (fr.length == 1) change['lhs-line-to'] = fr[0] - 1;
			else change['lhs-line-to'] = fr[1] - 1;
			var to = test[3].split(',');
			change['rhs-line-from'] = to[0] - 1;
			if (to.length == 1) change['rhs-line-to'] = to[0] - 1;
			else change['rhs-line-to'] = to[1] - 1;
			// TODO: optimize for changes that are adds/removes
			if (change['lhs-line-from'] < 0) change['lhs-line-from'] = 0;
			if (change['lhs-line-to'] < 0) change['lhs-line-to'] = 0;
			if (change['rhs-line-from'] < 0) change['rhs-line-from'] = 0;
			if (change['rhs-line-to'] < 0) change['rhs-line-to'] = 0;
			change['op'] = test[2];
			changes[change_id++] = change;
			this.trace('diff', 'change', change);
		}
		return changes;
	},
	_get_viewport: function(editor_name1, editor_name2) {
		var lhsvp = this.editor[editor_name1].getViewport();
		var rhsvp = this.editor[editor_name2].getViewport();
		return {from: Math.min(lhsvp.from, rhsvp.from), to: Math.max(lhsvp.to, rhsvp.to)};
	},
	_is_change_in_view: function(vp, change) {
		if (!this.settings.viewport) return true;
		if ((change['lhs-line-from'] < vp.from && change['lhs-line-to'] < vp.to) ||
			(change['lhs-line-from'] > vp.from && change['lhs-line-to'] > vp.to) ||
			(change['rhs-line-from'] < vp.from && change['rhs-line-to'] < vp.to) ||
			(change['rhs-line-from'] > vp.from && change['rhs-line-to'] > vp.to)) {
			// if the change is outside the viewport, skip
			return false;
		}
		return true;
	},
	_calculate_offsets: function (editor_name1, editor_name2, changes) {
		if (this.em_height == null) {
			// this is the distance from the top of the screen
			var topnode = jQuery('#' + this.id + ' .CodeMirror-measure').first();
			var top_offset = topnode.offset().top - 4;
			if (!top_offset) return;//try again
			this.draw_top_offset = 0.5 - top_offset;
			this.em_height = this.editor[editor_name1].defaultTextHeight();
			if (!this.em_height) {
				console.warn('Failed to calculate offsets, using 18 by default');
				this.em_height = 18;
			}
			this.draw_lhs_min = 0.5;
			var c = jQuery('#' + editor_name1 + '-' + editor_name2 + '-canvas');
			if (!c.length) {
				console.error('failed to find canvas', '#' + editor_name1 + '-' + editor_name2 + '-canvas');
			}
			if (!c.width()) {
				console.error('canvas width is 0');
				return;
			}
			this.draw_mid_width = jQuery('#' + editor_name1 + '-' + editor_name2 + '-canvas').width();
			this.draw_rhs_max = this.draw_mid_width - 0.5; //24.5;
			this.draw_lhs_width = 5;
			this.draw_rhs_width = 5;
			this.trace('calc', 'change offsets calculated', {top_offset: top_offset, lhs_min: this.draw_lhs_min, rhs_max: this.draw_rhs_max, lhs_width: this.draw_lhs_width, rhs_width: this.draw_rhs_width});
		}
		var lhschc = this.editor[editor_name1].charCoords({line: 0});
		var rhschc = this.editor[editor_name2].charCoords({line: 0});
		var vp = this._get_viewport(editor_name1, editor_name2);
		
		for (var i = 0; i < changes.length; ++i) {
			var change = changes[i];
			
			if (!this.settings.sidebar && !this._is_change_in_view(vp, change)) {
				// if the change is outside the viewport, skip
				delete change['lhs-y-start'];
				delete change['lhs-y-end'];
				delete change['rhs-y-start'];
				delete change['rhs-y-end'];
				continue;
			}
			
			var ls, le, rs, re;
			if (this.editor[editor_name1].getOption('lineWrapping') || this.editor[editor_name1].getOption('lineWrapping')) {
				// If using line-wrapping, we must get the height of the line
				var tls = this.editor[editor_name1].cursorCoords({line: change['lhs-line-from'], ch: 0}, 'page');
				var lhssh = this.editor[editor_name1].getLineHandle(change['lhs-line-from']);
				ls = { top: tls.top, bottom: tls.top + lhssh.height };

				var tle = this.editor[editor_name1].cursorCoords({line: change['lhs-line-to'], ch: 0}, 'page');
				var lhseh = this.editor[editor_name1].getLineHandle(change['lhs-line-to']);
				le = { top: tle.top, bottom: tle.top + lhseh.height };
				
				var tls = this.editor[editor_name2].cursorCoords({line: change['rhs-line-from'], ch: 0}, 'page');
				var rhssh = this.editor[editor_name2].getLineHandle(change['rhs-line-from']);
				rs = { top: tls.top, bottom: tls.top + rhssh.height };

				var tle = this.editor[editor_name2].cursorCoords({line: change['rhs-line-to'], ch: 0}, 'page');
				var rhseh = this.editor[editor_name2].getLineHandle(change['rhs-line-to']);
				re = { top: tle.top, bottom: tle.top + rhseh.height };
			}
			else {
				// If not using line-wrapping, we can calculate the line position
				ls = { 
					top: lhschc.top + change['lhs-line-from'] * this.em_height, 
					bottom: lhschc.bottom + change['lhs-line-from'] * this.em_height + 2
				};
				le = {
					top: lhschc.top + change['lhs-line-to'] * this.em_height, 
					bottom: lhschc.bottom + change['lhs-line-to'] * this.em_height + 2
				};
				rs = {
					top: rhschc.top + change['rhs-line-from'] * this.em_height, 
					bottom: rhschc.bottom + change['rhs-line-from'] * this.em_height + 2
				};
				re = {
					top: rhschc.top + change['rhs-line-to'] * this.em_height, 
					bottom: rhschc.bottom + change['rhs-line-to'] * this.em_height + 2
				};
			}
			
			if (change['op'] == 'a') {
				// adds (right), normally start from the end of the lhs,
				// except for the case when the start of the rhs is 0
				if (change['rhs-line-from'] > 0) {
					ls.top = ls.bottom;
					ls.bottom += this.em_height;
					le = ls;
				}
			}
			else if (change['op'] == 'd') {
				// deletes (left) normally finish from the end of the rhs,
				// except for the case when the start of the lhs is 0
				if (change['lhs-line-from'] > 0) {
					rs.top = rs.bottom;
					rs.bottom += this.em_height;
					re = rs;
				}
			}
			change['lhs-y-start'] = this.draw_top_offset + ls.top;
			if (change['op'] == 'c' || change['op'] == 'd') {
				change['lhs-y-end'] = this.draw_top_offset + le.bottom;
			}
			else {
				change['lhs-y-end'] = this.draw_top_offset + le.top;
			}
			change['rhs-y-start'] = this.draw_top_offset + rs.top;
			if (change['op'] == 'c' || change['op'] == 'a') {
				change['rhs-y-end'] = this.draw_top_offset + re.bottom;
			}
			else {
				change['rhs-y-end'] = this.draw_top_offset + re.top;
			}
			this.trace('calc', 'change calculated', i, change);
		}
		return changes;
	},
	_markup_changes: function (editor_name1, editor_name2, changes) {
		jQuery('.merge-button').remove(); // clear
		
		var self = this;
		var led = this.editor[editor_name1];
		var red = this.editor[editor_name2];

		var timer = new Mgly.Timer();
		led.operation(function() {
			for (var i = 0; i < changes.length; ++i) {
				var change = changes[i];
				
				var clazz = ['mergely', 'lhs', change['op'], 'cid-' + i];
				led.addLineClass(change['lhs-line-from'], 'background', 'start');
				led.addLineClass(change['lhs-line-to'], 'background', 'end');
				
				if (change['lhs-line-from'] == 0 && change['lhs-line-to'] == 0) {
					led.addLineClass(change['lhs-line-from'], 'background', clazz.join(' '));
					led.addLineClass(change['lhs-line-from'], 'background', 'first');
				}
				else {
					// apply change for each line in-between the changed lines
					for (var j = change['lhs-line-from']; j <= change['lhs-line-to']; ++j) {
						led.addLineClass(j, 'background', clazz.join(' '));
						led.addLineClass(j, 'background', clazz.join(' '));
					}
				}
				
				if (!red.getOption('readOnly')) {
					// add widgets to lhs, if rhs is not read only
					var rhs_button = self.merge_rhs_button.clone();
					if (rhs_button.button) {
						//jquery-ui support
						rhs_button.button({icons: {primary: 'ui-icon-triangle-1-e'}, text: false});
					}
					rhs_button.addClass('merge-button');
					rhs_button.attr('id', 'merge-rhs-' + i);
					led.setGutterMarker(change['lhs-line-from'], 'merge', rhs_button.get(0));
				}
			}
		});

		var vp = this._get_viewport(editor_name1, editor_name2);
		
		this.trace('change', 'markup lhs-editor time', timer.stop());
		red.operation(function() {
			for (var i = 0; i < changes.length; ++i) {
				var change = changes[i];
				
				if (!self._is_change_in_view(vp, change)) {
					// if the change is outside the viewport, skip
					continue;
				}
				
				var clazz = ['mergely', 'rhs', change['op'], 'cid-' + i];
				red.addLineClass(change['rhs-line-from'], 'background', 'start');
				red.addLineClass(change['rhs-line-to'], 'background', 'end');
				
				if (change['rhs-line-from'] == 0 && change['rhs-line-to'] == 0) {
					red.addLineClass(change['rhs-line-from'], 'background', clazz.join(' '));
					red.addLineClass(change['rhs-line-from'], 'background', 'first');
				}
				else {
					// apply change for each line in-between the changed lines
					for (var j = change['rhs-line-from']; j <= change['rhs-line-to']; ++j) {
						red.addLineClass(j, 'background', clazz.join(' '));
						red.addLineClass(j, 'background', clazz.join(' '));
					}
				}

				if (!led.getOption('readOnly')) {
					// add widgets to rhs, if lhs is not read only
					var lhs_button = self.merge_lhs_button.clone();
					if (lhs_button.button) {
						//jquery-ui support
						lhs_button.button({icons: {primary: 'ui-icon-triangle-1-w'}, text: false});
					}
					lhs_button.addClass('merge-button');
					lhs_button.attr('id', 'merge-lhs-' + i);
					red.setGutterMarker(change['rhs-line-from'], 'merge', lhs_button.get(0));
				}
			}
		});
		this.trace('change', 'markup rhs-editor time', timer.stop());
		
		// mark text deleted, LCS changes
		var marktext = [];
		for (var i = 0; this.settings.lcs && i < changes.length; ++i) {
			var change = changes[i];
			
			if (!this._is_change_in_view(vp, change)) {
				// if the change is outside the viewport, skip
				continue;
			}
			if (change['op'] == 'd') {
				// apply delete to cross-out (left-hand side only)
				var from = change['lhs-line-from'];
				var to = change['lhs-line-to'];
				var to_ln = led.lineInfo(to);
				if (to_ln) {
					marktext.push([led, {line:from, ch:0}, {line:to, ch:to_ln.text.length}, {className: 'mergely ch d lhs'}]);
				}
			}
			else if (change['op'] == 'c') {
				// apply LCS changes to each line
				for (var j = change['lhs-line-from'], k = change['rhs-line-from'], p = 0; 
					 ((j >= 0) && (j <= change['lhs-line-to'])) || ((k >= 0) && (k <= change['rhs-line-to']));
					 ++j, ++k) {
					if (k + p > change['rhs-line-to']) {
						// lhs continues past rhs, mark lhs as deleted
						var lhs_line = led.getLine( j );
						marktext.push([led, {line:j, ch:0}, {line:j, ch:lhs_line.length}, {className: 'mergely ch d lhs'}]);
						continue;
					}
					if (j + p > change['lhs-line-to']) {
						// rhs continues past lhs, mark rhs as added
						var rhs_line = red.getLine( k );
						marktext.push([red, {line:k, ch:0}, {line:k, ch:rhs_line.length}, {className: 'mergely ch a rhs'}]);
						continue;
					}
					var lhs_line = led.getLine( j );
					var rhs_line = red.getLine( k );
					var lhs_start = { line: -1, ch: -1 };
					var lhs_stop = { line: -1, ch: -1 };
					var rhs_start = { line: -1, ch: -1 };
					var rhs_stop = { line: -1, ch: -1 };
					
					var lcs = new Mgly.LCS(lhs_line, rhs_line);
					lcs.diff(
						function (from, to) {//added
							marktext.push([red, {line:k, ch:from}, {line:k, ch:to}, {className: 'mergely ch a rhs'}]);
						},
						removed = function (from, to) {//removed
							marktext.push([led, {line:j, ch:from}, {line:j, ch:to}, {className: 'mergely ch d lhs'}]);
						}
					);
				}
			}
		}
		this.trace('change', 'LCS marktext time', timer.stop());
		
		// mark changes outside closure
		led.operation(function() {
			// apply lhs markup
			for (var i = 0; i < marktext.length; ++i) {
				var m = marktext[i];
				if (m[0].doc.id != led.getDoc().id) continue;
				self.chfns[self.id + '-lhs'].push(m[0].markText(m[1], m[2], m[3]));
			}
		});
		red.operation(function() {
			// apply lhs markup
			for (var i = 0; i < marktext.length; ++i) {
				var m = marktext[i];
				if (m[0].doc.id != red.getDoc().id) continue;
				self.chfns[self.id + '-rhs'].push(m[0].markText(m[1], m[2], m[3]));
			}
		});
		this.trace('change', 'LCS markup time', timer.stop());
		
		// merge buttons
		var ed = {lhs:led, rhs:red};
		jQuery('.merge-button').on('click', function(ev){
			// side of mouseenter
			var side = 'rhs';
			var oside = 'lhs';
			var parent = jQuery(this).parents('#' + self.id + '-editor-lhs');
			if (parent.length) {
				side = 'lhs';
				oside = 'rhs';
			}
			var pos = ed[side].coordsChar({left:ev.pageX, top:ev.pageY});

			// get the change id
			var cid = null;
			var info = ed[side].lineInfo(pos.line);
			jQuery.each(info.bgClass.split(' '), function(i, clazz) {
				if (clazz.indexOf('cid-') == 0) {
					cid = parseInt(clazz.split('-')[1]);
					return false;
				}
			});
			var change = self.changes[cid];

			var line = {lhs: ed['lhs'].lineInfo(change['lhs-line-to']), rhs: ed['rhs'].lineInfo(change['rhs-line-to'])};
			var text = ed[side].getRange(
				{ line: change[side + '-line-from'], ch: 0 },
				{ line: change[side + '-line-to'], ch: line[side].text.length });
			
			if (side == 'rhs') {
				if (change['op'] == 'c') {
					ed[oside].replaceRange( text,
						{ line: change[oside + '-line-from'], ch: 0 },
						{ line: change[oside + '-line-to'], ch: line[oside].text.length });
				}
				else if (change['op'] == 'a') {
					ed[oside].replaceRange( '\n' + text,
						{ line: change[oside + '-line-from'], ch: line[oside].text.length },
						{ line: change[oside + '-line-to'], ch: line[oside].text.length });
				}
				else {// 'd'
					var from = parseInt(change[oside + '-line-from']);
					var to = parseInt(change[oside + '-line-to']);
					for (var i = to; i >= from; --i) {
						ed[oside].removeLine(i);
					}
				}
			}
			else { // lhs
				if (change['op'] == 'c') {
					ed[oside].replaceRange( text,
						{ line: change[oside + '-line-from'], ch: 0 },
						{ line: change[oside + '-line-to'], ch: line[oside].text.length });
				}
				else if (change['op'] == 'a') {
					var from = parseInt(change[oside + '-line-from']);
					var to = parseInt(change[oside + '-line-to']);
					for (var i = to; i >= from; --i) {
						ed[oside].removeLine(i);
					}
				}
				else {// 'd'
					var from = parseInt(change[oside + '-line-from']);
					var to = parseInt(change[oside + '-line-to']);
					ed[oside].replaceRange( '\n' + text,
						{ line: change[oside + '-line-from'], ch: line[oside].text.length },
						{ line: change[oside + '-line-to'], ch: line[oside].text.length });
				}
			}
			//reset
			ed['lhs'].setValue(ed['lhs'].getValue());
			ed['rhs'].setValue(ed['rhs'].getValue());
			return false;
		});
		this.trace('change', 'markup buttons time', timer.stop());
	},
	_draw_info: function(editor_name1, editor_name2) {
		var visible_page_height = jQuery(this.editor[editor_name1].getScrollerElement()).height();
		var gutter_height = jQuery(this.editor[editor_name1].getScrollerElement()).children(':first-child').height();
		var dcanvas = document.getElementById(editor_name1 + '-' + editor_name2 + '-canvas');
		if (dcanvas == undefined) throw 'Failed to find: ' + editor_name1 + '-' + editor_name2 + '-canvas';
		var clhs = jQuery('#' + this.id + '-lhs-margin');
		var crhs = jQuery('#' + this.id + '-rhs-margin');
		return {
			visible_page_height: visible_page_height,
			gutter_height: gutter_height,
			visible_page_ratio: (visible_page_height / gutter_height),
			margin_ratio: (visible_page_height / gutter_height),
			lhs_scroller: jQuery(this.editor[editor_name1].getScrollerElement()),
			rhs_scroller: jQuery(this.editor[editor_name2].getScrollerElement()),
			lhs_lines: this.editor[editor_name1].lineCount(),
			rhs_lines: this.editor[editor_name2].lineCount(),
			dcanvas: dcanvas,
			clhs: clhs,
			crhs: crhs,
			lhs_xyoffset: jQuery(clhs).offset(),
			rhs_xyoffset: jQuery(crhs).offset()
		};
	},
	_draw_diff: function(editor_name1, editor_name2, changes) {
		var ex = this._draw_info(editor_name1, editor_name2);
		var mcanvas_lhs = ex.clhs.get(0);
		var mcanvas_rhs = ex.crhs.get(0);
		var ctx = ex.dcanvas.getContext('2d');
		var ctx_lhs = mcanvas_lhs.getContext('2d');
		var ctx_rhs = mcanvas_rhs.getContext('2d');

		this.trace('draw', 'visible_page_height', ex.visible_page_height);
		this.trace('draw', 'gutter_height', ex.gutter_height);
		this.trace('draw', 'visible_page_ratio', ex.visible_page_ratio);
		this.trace('draw', 'lhs-scroller-top', ex.lhs_scroller.scrollTop());
		this.trace('draw', 'rhs-scroller-top', ex.rhs_scroller.scrollTop());
		
		jQuery.each(jQuery.find('#' + this.id + ' canvas'), function () {
			jQuery(this).get(0).height = ex.visible_page_height;
		});
		
		ex.clhs.unbind('click');
		ex.crhs.unbind('click');
		
		ctx_lhs.beginPath();
		ctx_lhs.fillStyle = this.settings.bgcolor;
		ctx_lhs.strokeStyle = '#888';
		ctx_lhs.fillRect(0, 0, 6.5, ex.visible_page_height);
		ctx_lhs.strokeRect(0, 0, 6.5, ex.visible_page_height);

		ctx_rhs.beginPath();
		ctx_rhs.fillStyle = this.settings.bgcolor;
		ctx_rhs.strokeStyle = '#888';
		ctx_rhs.fillRect(0, 0, 6.5, ex.visible_page_height);
		ctx_rhs.strokeRect(0, 0, 6.5, ex.visible_page_height);

		var vp = this._get_viewport(editor_name1, editor_name2);
		for (var i = 0; i < changes.length; ++i) {
			var change = changes[i];

			this.trace('draw', change);
			// margin indicators
			var lhs_y_start = ((change['lhs-y-start'] + ex.lhs_scroller.scrollTop()) * ex.visible_page_ratio);
			var lhs_y_end = ((change['lhs-y-end'] + ex.lhs_scroller.scrollTop()) * ex.visible_page_ratio) + 1;
			var rhs_y_start = ((change['rhs-y-start'] + ex.rhs_scroller.scrollTop()) * ex.visible_page_ratio);
			var rhs_y_end = ((change['rhs-y-end'] + ex.rhs_scroller.scrollTop()) * ex.visible_page_ratio) + 1;
			this.trace('draw', 'marker calculated', lhs_y_start, lhs_y_end, rhs_y_start, rhs_y_end);

			ctx_lhs.beginPath();
			ctx_lhs.fillStyle = this.settings.fgcolor[change['op']];
			ctx_lhs.strokeStyle = '#000';
			ctx_lhs.lineWidth = 0.5;
			ctx_lhs.fillRect(1.5, lhs_y_start, 4.5, Math.max(lhs_y_end - lhs_y_start, 5));
			ctx_lhs.strokeRect(1.5, lhs_y_start, 4.5, Math.max(lhs_y_end - lhs_y_start, 5));

			ctx_rhs.beginPath();
			ctx_rhs.fillStyle = this.settings.fgcolor[change['op']];
			ctx_rhs.strokeStyle = '#000';
			ctx_rhs.lineWidth = 0.5;
			ctx_rhs.fillRect(1.5, rhs_y_start, 4.5, Math.max(rhs_y_end - rhs_y_start, 5));
			ctx_rhs.strokeRect(1.5, rhs_y_start, 4.5, Math.max(rhs_y_end - rhs_y_start, 5));
			
			if (!this._is_change_in_view(vp, change)) {
				continue;
			}
			
			lhs_y_start = change['lhs-y-start'];
			lhs_y_end = change['lhs-y-end'];
			rhs_y_start = change['rhs-y-start'];
			rhs_y_end = change['rhs-y-end'];
			
			var radius = 3;
			
			// draw left box
			ctx.beginPath();
			ctx.strokeStyle = this.settings.fgcolor[change['op']];
			ctx.lineWidth = 1;
			
			var rectWidth = this.draw_lhs_width;
			var rectHeight = lhs_y_end - lhs_y_start - 1;
			var rectX = this.draw_lhs_min;
			var rectY = lhs_y_start;
			// top and top top-right corner
			
			// draw left box
			ctx.moveTo(rectX, rectY);
			if (navigator.appName == 'Microsoft Internet Explorer') {
				// IE arcs look awful
				ctx.lineTo(this.draw_lhs_min + this.draw_lhs_width, lhs_y_start);
				ctx.lineTo(this.draw_lhs_min + this.draw_lhs_width, lhs_y_end + 1);
				ctx.lineTo(this.draw_lhs_min, lhs_y_end + 1);
			}
			else {
				if (rectHeight <= 0) {
					ctx.lineTo(rectX + rectWidth, rectY);
				}
				else {
					ctx.arcTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + radius, radius);
					ctx.arcTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - radius, rectY + rectHeight, radius);
				}
				// bottom line
				ctx.lineTo(rectX, rectY + rectHeight);
			}
			ctx.stroke();
			
			rectWidth = this.draw_rhs_width;
			rectHeight = rhs_y_end - rhs_y_start - 1;
			rectX = this.draw_rhs_max;
			rectY = rhs_y_start;

			// draw right box
			ctx.moveTo(rectX, rectY);
			if (navigator.appName == 'Microsoft Internet Explorer') {
				ctx.lineTo(this.draw_rhs_max - this.draw_rhs_width, rhs_y_start);
				ctx.lineTo(this.draw_rhs_max - this.draw_rhs_width, rhs_y_end + 1);
				ctx.lineTo(this.draw_rhs_max, rhs_y_end + 1);
			}
			else {
				if (rectHeight <= 0) {
					ctx.lineTo(rectX - rectWidth, rectY);
				}
				else {
					ctx.arcTo(rectX - rectWidth, rectY, rectX - rectWidth, rectY + radius, radius);
					ctx.arcTo(rectX - rectWidth, rectY + rectHeight, rectX - radius, rectY + rectHeight, radius);
				}
				ctx.lineTo(rectX, rectY + rectHeight);
			}
			ctx.stroke();
			
			// connect boxes
			var cx = this.draw_lhs_min + this.draw_lhs_width;
			var cy = lhs_y_start + (lhs_y_end + 1 - lhs_y_start) / 2.0;
			var dx = this.draw_rhs_max - this.draw_rhs_width;
			var dy = rhs_y_start + (rhs_y_end + 1 - rhs_y_start) / 2.0;
			ctx.moveTo(cx, cy);
			if (cy == dy) {
				ctx.lineTo(dx, dy);
			}
			else {
				// fancy!
				ctx.bezierCurveTo(
					cx + 12, cy - 3, // control-1 X,Y
					dx - 12, dy - 3, // control-2 X,Y
					dx, dy);
			}
			ctx.stroke();
		}

		// visible window feedback
		ctx_lhs.fillStyle = this.settings.vpcolor;
		ctx_rhs.fillStyle = this.settings.vpcolor;
		
		var to = ex.clhs.height() * ex.visible_page_ratio;
		var from = (ex.lhs_scroller.scrollTop() / ex.gutter_height) * ex.clhs.height();
		this.trace('draw', 'cls.height', ex.clhs.height());
		this.trace('draw', 'lhs_scroller.scrollTop()', ex.lhs_scroller.scrollTop());
		this.trace('draw', 'gutter_height', ex.gutter_height);
		this.trace('draw', 'visible_page_ratio', ex.visible_page_ratio);
		this.trace('draw', 'from', from, 'to', to);
		
		ctx_lhs.fillRect(1.5, from, 4.5, to);
		ctx_rhs.fillRect(1.5, from, 4.5, to);
		
		ex.clhs.click(function (ev) {
			var y = ev.pageY - lhs_xyoffset.top - (to / 2);
			var sto = Math.max(0, (y / ex.mcanvas_lhs.height) * ex.lhs_scroller.get(0).scrollHeight);
			ex.lhs_scroller.scrollTop(sto);
		});
		ex.crhs.click(function (ev) {
			var y = ev.pageY - rhs_xyoffset.top - (to / 2);
			var sto = Math.max(0, (y / ex.mcanvas_rhs.height) * ex.rhs_scroller.get(0).scrollHeight);
			ex.rhs_scroller.scrollTop(sto);
		});
	},
	trace: function(name) {
		if(this.settings._debug.indexOf(name) >= 0) {
			arguments[0] = name+':';
			console.log([].slice.apply(arguments));
		} 
	}
});

jQuery.pluginMaker = function(plugin) {
	// add the plugin function as a jQuery plugin
	jQuery.fn[plugin.prototype.name] = function(options) {
		// get the arguments 
		var args = jQuery.makeArray(arguments),
		after = args.slice(1);
		var rc = undefined;
		this.each(function() {
			// see if we have an instance
			var instance = jQuery.data(this, plugin.prototype.name);
			if (instance) {
				// call a method on the instance
				if (typeof options == "string") {
					rc = instance[options].apply(instance, after);
				} else if (instance.update) {
					// call update on the instance
					return instance.update.apply(instance, args);
				}
			} else {
				// create the plugin
				new plugin(this, options);
			}
		});
		if (rc != undefined) return rc;
	};
};

// make the mergely widget
jQuery.pluginMaker(Mgly.mergely);

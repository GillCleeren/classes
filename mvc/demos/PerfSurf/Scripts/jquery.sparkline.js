﻿/* jquery.sparkline 1.6 - http://omnipotent.net/jquery.sparkline/ 
** Licensed under the New BSD License - see above site for details */

(function ($) {
    var defaults = { common: { type: 'line', lineColor: '#00f', fillColor: '#cdf', defaultPixelsPerValue: 3, width: 'auto', height: 'auto', composite: false, tagValuesAttribute: 'values', tagOptionsPrefix: 'spark', enableTagOptions: false }, line: { spotColor: '#f80', spotRadius: 1.5, minSpotColor: '#f80', maxSpotColor: '#f80', lineWidth: 1, normalRangeMin: undefined, normalRangeMax: undefined, normalRangeColor: '#ccc', drawNormalOnTop: false, chartRangeMin: undefined, chartRangeMax: undefined, chartRangeMinX: undefined, chartRangeMaxX: undefined }, bar: { barColor: '#00f', negBarColor: '#f44', zeroColor: undefined, nullColor: undefined, zeroAxis: undefined, barWidth: 4, barSpacing: 1, chartRangeMax: undefined, chartRangeMin: undefined, chartRangeClip: false, colorMap: undefined }, tristate: { barWidth: 4, barSpacing: 1, posBarColor: '#6f6', negBarColor: '#f44', zeroBarColor: '#999', colorMap: {} }, discrete: { lineHeight: 'auto', thresholdColor: undefined, thresholdValue: 0, chartRangeMax: undefined, chartRangeMin: undefined, chartRangeClip: false }, bullet: { targetColor: 'red', targetWidth: 3, performanceColor: 'blue', rangeColors: ['#D3DAFE', '#A8B6FF', '#7F94FF'], base: undefined }, pie: { sliceColors: ['#f00', '#0f0', '#00f'] }, box: { raw: false, boxLineColor: 'black', boxFillColor: '#cdf', whiskerColor: 'black', outlierLineColor: '#333', outlierFillColor: 'white', medianColor: 'red', showOutliers: true, outlierIQR: 1.5, spotRadius: 1.5, target: undefined, targetColor: '#4a2', chartRangeMax: undefined, chartRangeMin: undefined} }; var VCanvas_base, VCanvas_canvas, VCanvas_vml; $.fn.simpledraw = function (width, height, use_existing) {
        if (use_existing && this[0].VCanvas) { return this[0].VCanvas; }
        if (width === undefined) { width = $(this).innerWidth(); }
        if (height === undefined) { height = $(this).innerHeight(); }
        if ($.browser.hasCanvas) { return new VCanvas_canvas(width, height, this); } else if ($.browser.msie) { return new VCanvas_vml(width, height, this); } else { return false; } 
    }; var pending = []; $.fn.sparkline = function (uservalues, userOptions) {
        return this.each(function () {
            var options = new $.fn.sparkline.options(this, userOptions); var render = function () {
                var values, width, height; if (uservalues === 'html' || uservalues === undefined) {
                    var vals = this.getAttribute(options.get('tagValuesAttribute')); if (vals === undefined || vals === null) { vals = $(this).html(); }
                    values = vals.replace(/(^\s*<!--)|(-->\s*$)|\s+/g, '').split(',');
                } else { values = uservalues; }
                width = options.get('width') == 'auto' ? values.length * options.get('defaultPixelsPerValue') : options.get('width'); if (options.get('height') == 'auto') { if (!options.get('composite') || !this.VCanvas) { var tmp = document.createElement('span'); tmp.innerHTML = 'a'; $(this).html(tmp); height = $(tmp).innerHeight(); $(tmp).remove(); } } else { height = options.get('height'); }
                $.fn.sparkline[options.get('type')].call(this, values, options, width, height);
            }; if (($(this).html() && $(this).is(':hidden')) || ($.fn.jquery < "1.3.0" && $(this).parents().is(':hidden')) || !$(this).parents('body').length) { pending.push([this, render]); } else { render.call(this); } 
        });
    }; $.fn.sparkline.defaults = defaults; $.sparkline_display_visible = function () { for (var i = pending.length - 1; i >= 0; i--) { var el = pending[i][0]; if ($(el).is(':visible') && !$(el).parents().is(':hidden')) { pending[i][1].call(el); pending.splice(i, 1); } } }; var UNSET_OPTION = {}; var normalizeValue = function (val) {
        switch (val) { case 'undefined': val = undefined; break; case 'null': val = null; break; case 'true': val = true; break; case 'false': val = false; break; default: var nf = parseFloat(val); if (val == nf) { val = nf; } }
        return val;
    }; $.fn.sparkline.options = function (tag, userOptions) {
        var extendedOptions; this.userOptions = userOptions = userOptions || {}; this.tag = tag; this.tagValCache = {}; var defaults = $.fn.sparkline.defaults; var base = defaults.common; this.tagOptionsPrefix = userOptions.enableTagOptions && (userOptions.tagOptionsPrefix || base.tagOptionsPrefix); var tagOptionType = this.getTagSetting('type'); if (tagOptionType === UNSET_OPTION) { extendedOptions = defaults[userOptions.type || base.type]; } else { extendedOptions = defaults[tagOptionType]; }
        this.mergedOptions = $.extend({}, base, extendedOptions, userOptions);
    }; $.fn.sparkline.options.prototype.getTagSetting = function (key) {
        var val, i, prefix = this.tagOptionsPrefix; if (prefix === false || prefix === undefined) { return UNSET_OPTION; }
        if (this.tagValCache.hasOwnProperty(key)) { val = this.tagValCache.key; } else {
            val = this.tag.getAttribute(prefix + key); if (val === undefined || val === null) { val = UNSET_OPTION; } else if (val.substr(0, 1) == '[') { val = val.substr(1, val.length - 2).split(','); for (i = val.length; i--; ) { val[i] = normalizeValue(val[i].replace(/(^\s*)|(\s*$)/g, '')); } } else if (val.substr(0, 1) == '{') { var pairs = val.substr(1, val.length - 2).split(','); val = {}; for (i = pairs.length; i--; ) { var keyval = pairs[i].split(':', 2); val[keyval[0].replace(/(^\s*)|(\s*$)/g, '')] = normalizeValue(keyval[1].replace(/(^\s*)|(\s*$)/g, '')); } } else { val = normalizeValue(val); }
            this.tagValCache.key = val;
        }
        return val;
    }; $.fn.sparkline.options.prototype.get = function (key) {
        var tagOption = this.getTagSetting(key); if (tagOption !== UNSET_OPTION) { return tagOption; }
        return this.mergedOptions[key];
    }; $.fn.sparkline.line = function (values, options, width, height) {
        var xvalues = [], yvalues = [], yminmax = []; for (var i = 0; i < values.length; i++) { var val = values[i]; var isstr = typeof (values[i]) == 'string'; var isarray = typeof (values[i]) == 'object' && values[i] instanceof Array; var sp = isstr && values[i].split(':'); if (isstr && sp.length == 2) { xvalues.push(Number(sp[0])); yvalues.push(Number(sp[1])); yminmax.push(Number(sp[1])); } else if (isarray) { xvalues.push(val[0]); yvalues.push(val[1]); yminmax.push(val[1]); } else { xvalues.push(i); if (values[i] === null || values[i] == 'null') { yvalues.push(null); } else { yvalues.push(Number(val)); yminmax.push(Number(val)); } } }
        if (options.get('xvalues')) { xvalues = options.get('xvalues'); }
        var maxy = Math.max.apply(Math, yminmax); var maxyval = maxy; var miny = Math.min.apply(Math, yminmax); var minyval = miny; var maxx = Math.max.apply(Math, xvalues); var minx = Math.min.apply(Math, xvalues); var normalRangeMin = options.get('normalRangeMin'); var normalRangeMax = options.get('normalRangeMax'); if (normalRangeMin !== undefined) {
            if (normalRangeMin < miny) { miny = normalRangeMin; }
            if (normalRangeMax > maxy) { maxy = normalRangeMax; } 
        }
        if (options.get('chartRangeMin') !== undefined && (options.get('chartRangeClip') || options.get('chartRangeMin') < miny)) { miny = options.get('chartRangeMin'); }
        if (options.get('chartRangeMax') !== undefined && (options.get('chartRangeClip') || options.get('chartRangeMax') > maxy)) { maxy = options.get('chartRangeMax'); }
        if (options.get('chartRangeMinX') !== undefined && (options.get('chartRangeClipX') || options.get('chartRangeMinX') < minx)) { minx = options.get('chartRangeMinX'); }
        if (options.get('chartRangeMaxX') !== undefined && (options.get('chartRangeClipX') || options.get('chartRangeMaxX') > maxx)) { maxx = options.get('chartRangeMaxX'); }
        var rangex = maxx - minx === 0 ? 1 : maxx - minx; var rangey = maxy - miny === 0 ? 1 : maxy - miny; var vl = yvalues.length - 1; if (vl < 1) { this.innerHTML = ''; return; }
        var target = $(this).simpledraw(width, height, options.get('composite')); if (target) {
            var canvas_width = target.pixel_width; var canvas_height = target.pixel_height; var canvas_top = 0; var canvas_left = 0; var spotRadius = options.get('spotRadius'); if (spotRadius && (canvas_width < (spotRadius * 4) || canvas_height < (spotRadius * 4))) { spotRadius = 0; }
            if (spotRadius) {
                if (options.get('minSpotColor') || (options.get('spotColor') && yvalues[vl] == miny)) { canvas_height -= Math.ceil(spotRadius); }
                if (options.get('maxSpotColor') || (options.get('spotColor') && yvalues[vl] == maxy)) { canvas_height -= Math.ceil(spotRadius); canvas_top += Math.ceil(spotRadius); }
                if (options.get('minSpotColor') || options.get('maxSpotColor') && (yvalues[0] == miny || yvalues[0] == maxy)) { canvas_left += Math.ceil(spotRadius); canvas_width -= Math.ceil(spotRadius); }
                if (options.get('spotColor') || (options.get('minSpotColor') || options.get('maxSpotColor') && (yvalues[vl] == miny || yvalues[vl] == maxy))) { canvas_width -= Math.ceil(spotRadius); } 
            }
            canvas_height--; var drawNormalRange = function () { if (normalRangeMin !== undefined) { var ytop = canvas_top + Math.round(canvas_height - (canvas_height * ((normalRangeMax - miny) / rangey))); var height = Math.round((canvas_height * (normalRangeMax - normalRangeMin)) / rangey); target.drawRect(canvas_left, ytop, canvas_width, height, undefined, options.get('normalRangeColor')); } }; if (!options.get('drawNormalOnTop')) { drawNormalRange(); }
            var path = []; var paths = [path]; var x, y, vlen = yvalues.length; for (i = 0; i < vlen; i++) {
                x = xvalues[i]; y = yvalues[i]; if (y === null) { if (i) { if (yvalues[i - 1] !== null) { path = []; paths.push(path); } } } else {
                    if (y < miny) { y = miny; }
                    if (y > maxy) { y = maxy; }
                    if (!path.length) { path.push([canvas_left + Math.round((x - minx) * (canvas_width / rangex)), canvas_top + canvas_height]); }
                    path.push([canvas_left + Math.round((x - minx) * (canvas_width / rangex)), canvas_top + Math.round(canvas_height - (canvas_height * ((y - miny) / rangey)))]);
                } 
            }
            var lineshapes = []; var fillshapes = []; var plen = paths.length; for (i = 0; i < plen; i++) {
                path = paths[i]; if (!path.length) { continue; }
                if (options.get('fillColor')) { path.push([path[path.length - 1][0], canvas_top + canvas_height - 1]); fillshapes.push(path.slice(0)); path.pop(); }
                if (path.length > 2) { path[0] = [path[0][0], path[1][1]]; }
                lineshapes.push(path);
            }
            plen = fillshapes.length; for (i = 0; i < plen; i++) { target.drawShape(fillshapes[i], undefined, options.get('fillColor')); }
            if (options.get('drawNormalOnTop')) { drawNormalRange(); }
            plen = lineshapes.length; for (i = 0; i < plen; i++) { target.drawShape(lineshapes[i], options.get('lineColor'), undefined, options.get('lineWidth')); }
            if (spotRadius && options.get('spotColor')) { target.drawCircle(canvas_left + Math.round(xvalues[xvalues.length - 1] * (canvas_width / rangex)), canvas_top + Math.round(canvas_height - (canvas_height * ((yvalues[vl] - miny) / rangey))), spotRadius, undefined, options.get('spotColor')); }
            if (maxy != minyval) {
                if (spotRadius && options.get('minSpotColor')) { x = xvalues[$.inArray(minyval, yvalues)]; target.drawCircle(canvas_left + Math.round((x - minx) * (canvas_width / rangex)), canvas_top + Math.round(canvas_height - (canvas_height * ((minyval - miny) / rangey))), spotRadius, undefined, options.get('minSpotColor')); }
                if (spotRadius && options.get('maxSpotColor')) { x = xvalues[$.inArray(maxyval, yvalues)]; target.drawCircle(canvas_left + Math.round((x - minx) * (canvas_width / rangex)), canvas_top + Math.round(canvas_height - (canvas_height * ((maxyval - miny) / rangey))), spotRadius, undefined, options.get('maxSpotColor')); } 
            } 
        } else { this.innerHTML = ''; } 
    }; $.fn.sparkline.bar = function (values, options, width, height) {
        width = (values.length * options.get('barWidth')) + ((values.length - 1) * options.get('barSpacing')); var num_values = []; for (var i = 0, vlen = values.length; i < vlen; i++) { if (values[i] == 'null' || values[i] === null) { values[i] = null; } else { values[i] = Number(values[i]); num_values.push(Number(values[i])); } }
        var max = Math.max.apply(Math, num_values), min = Math.min.apply(Math, num_values); if (options.get('chartRangeMin') !== undefined && (options.get('chartRangeClip') || options.get('chartRangeMin') < min)) { min = options.get('chartRangeMin'); }
        if (options.get('chartRangeMax') !== undefined && (options.get('chartRangeClip') || options.get('chartRangeMax') > max)) { max = options.get('chartRangeMax'); }
        var zeroAxis = options.get('zeroAxis'); if (zeroAxis === undefined) { zeroAxis = min < 0; }
        var range = max - min === 0 ? 1 : max - min; var colorMapByIndex, colorMapByValue; if ($.isArray(options.get('colorMap'))) { colorMapByIndex = options.get('colorMap'); colorMapByValue = null; } else { colorMapByIndex = null; colorMapByValue = options.get('colorMap'); }
        var target = $(this).simpledraw(width, height, options.get('composite')); if (target) {
            var color, canvas_height = target.pixel_height, yzero = min < 0 && zeroAxis ? canvas_height - Math.round(canvas_height * (Math.abs(min) / range)) - 1 : canvas_height - 1; for (i = values.length; i--; ) {
                var x = i * (options.get('barWidth') + options.get('barSpacing')), y, val = values[i]; if (val === null) { if (options.get('nullColor')) { color = options.get('nullColor'); val = (zeroAxis && min < 0) ? 0 : min; height = 1; y = (zeroAxis && min < 0) ? yzero : canvas_height - height; } else { continue; } } else {
                    if (val < min) { val = min; }
                    if (val > max) { val = max; }
                    color = (val < 0) ? options.get('negBarColor') : options.get('barColor'); if (zeroAxis && min < 0) { height = Math.round(canvas_height * ((Math.abs(val) / range))) + 1; y = (val < 0) ? yzero : yzero - height; } else { height = Math.round(canvas_height * ((val - min) / range)) + 1; y = canvas_height - height; }
                    if (val === 0 && options.get('zeroColor') !== undefined) { color = options.get('zeroColor'); }
                    if (colorMapByValue && colorMapByValue[val]) { color = colorMapByValue[val]; } else if (colorMapByIndex && colorMapByIndex.length > i) { color = colorMapByIndex[i]; }
                    if (color === null) { continue; } 
                }
                target.drawRect(x, y, options.get('barWidth') - 1, height - 1, color, color);
            } 
        } else { this.innerHTML = ''; } 
    }; $.fn.sparkline.tristate = function (values, options, width, height) {
        values = $.map(values, Number); width = (values.length * options.get('barWidth')) + ((values.length - 1) * options.get('barSpacing')); var colorMapByIndex, colorMapByValue; if ($.isArray(options.get('colorMap'))) { colorMapByIndex = options.get('colorMap'); colorMapByValue = null; } else { colorMapByIndex = null; colorMapByValue = options.get('colorMap'); }
        var target = $(this).simpledraw(width, height, options.get('composite')); if (target) {
            var canvas_height = target.pixel_height, half_height = Math.round(canvas_height / 2); for (var i = values.length; i--; ) {
                var x = i * (options.get('barWidth') + options.get('barSpacing')), y, color; if (values[i] < 0) { y = half_height; height = half_height - 1; color = options.get('negBarColor'); } else if (values[i] > 0) { y = 0; height = half_height - 1; color = options.get('posBarColor'); } else { y = half_height - 1; height = 2; color = options.get('zeroBarColor'); }
                if (colorMapByValue && colorMapByValue[values[i]]) { color = colorMapByValue[values[i]]; } else if (colorMapByIndex && colorMapByIndex.length > i) { color = colorMapByIndex[i]; }
                if (color === null) { continue; }
                target.drawRect(x, y, options.get('barWidth') - 1, height - 1, color, color);
            } 
        } else { this.innerHTML = ''; } 
    }; $.fn.sparkline.discrete = function (values, options, width, height) {
        values = $.map(values, Number); width = options.get('width') == 'auto' ? values.length * 2 : width; var interval = Math.floor(width / values.length); var target = $(this).simpledraw(width, height, options.get('composite')); if (target) {
            var canvas_height = target.pixel_height, line_height = options.get('lineHeight') == 'auto' ? Math.round(canvas_height * 0.3) : options.get('lineHeight'), pheight = canvas_height - line_height, min = Math.min.apply(Math, values), max = Math.max.apply(Math, values); if (options.get('chartRangeMin') !== undefined && (options.get('chartRangeClip') || options.get('chartRangeMin') < min)) { min = options.get('chartRangeMin'); }
            if (options.get('chartRangeMax') !== undefined && (options.get('chartRangeClip') || options.get('chartRangeMax') > max)) { max = options.get('chartRangeMax'); }
            var range = max - min; for (var i = values.length; i--; ) {
                var val = values[i]; if (val < min) { val = min; }
                if (val > max) { val = max; }
                var x = (i * interval), ytop = Math.round(pheight - pheight * ((val - min) / range)); target.drawLine(x, ytop, x, ytop + line_height, (options.get('thresholdColor') && val < options.get('thresholdValue')) ? options.get('thresholdColor') : options.get('lineColor'));
            } 
        } else { this.innerHTML = ''; } 
    }; $.fn.sparkline.bullet = function (values, options, width, height) {
        values = $.map(values, Number); width = options.get('width') == 'auto' ? '4.0em' : width; var target = $(this).simpledraw(width, height, options.get('composite')); if (target && values.length > 1) {
            var canvas_width = target.pixel_width - Math.ceil(options.get('targetWidth') / 2), canvas_height = target.pixel_height, min = Math.min.apply(Math, values), max = Math.max.apply(Math, values); if (options.get('base') === undefined) { min = min < 0 ? min : 0; } else { min = options.get('base'); }
            var range = max - min; for (var i = 2, vlen = values.length; i < vlen; i++) { var rangeval = values[i], rangewidth = Math.round(canvas_width * ((rangeval - min) / range)); target.drawRect(0, 0, rangewidth - 1, canvas_height - 1, options.get('rangeColors')[i - 2], options.get('rangeColors')[i - 2]); }
            var perfval = values[1], perfwidth = Math.round(canvas_width * ((perfval - min) / range)); target.drawRect(0, Math.round(canvas_height * 0.3), perfwidth - 1, Math.round(canvas_height * 0.4) - 1, options.get('performanceColor'), options.get('performanceColor')); var targetval = values[0], x = Math.round(canvas_width * ((targetval - min) / range) - (options.get('targetWidth') / 2)), targettop = Math.round(canvas_height * 0.10), targetheight = canvas_height - (targettop * 2); target.drawRect(x, targettop, options.get('targetWidth') - 1, targetheight - 1, options.get('targetColor'), options.get('targetColor'));
        } else { this.innerHTML = ''; } 
    }; $.fn.sparkline.pie = function (values, options, width, height) {
        values = $.map(values, Number); width = options.get('width') == 'auto' ? height : width; var target = $(this).simpledraw(width, height, options.get('composite')); if (target && values.length > 1) {
            var canvas_width = target.pixel_width, canvas_height = target.pixel_height, radius = Math.floor(Math.min(canvas_width, canvas_height) / 2), total = 0, next = 0, circle = 2 * Math.PI; for (var i = values.length; i--; ) { total += values[i]; }
            if (options.get('offset')) { next += (2 * Math.PI) * (options.get('offset') / 360); }
            var vlen = values.length; for (i = 0; i < vlen; i++) {
                var start = next; var end = next; if (total > 0) { end = next + (circle * (values[i] / total)); }
                target.drawPieSlice(radius, radius, radius, start, end, undefined, options.get('sliceColors')[i % options.get('sliceColors').length]); next = end;
            } 
        } 
    }; var quartile = function (values, q) { if (q == 2) { var vl2 = Math.floor(values.length / 2); return values.length % 2 ? values[vl2] : (values[vl2] + values[vl2 + 1]) / 2; } else { var vl4 = Math.floor(values.length / 4); return values.length % 2 ? (values[vl4 * q] + values[vl4 * q + 1]) / 2 : values[vl4 * q]; } }; $.fn.sparkline.box = function (values, options, width, height) {
        values = $.map(values, Number); width = options.get('width') == 'auto' ? '4.0em' : width; var minvalue = options.get('chartRangeMin') === undefined ? Math.min.apply(Math, values) : options.get('chartRangeMin'), maxvalue = options.get('chartRangeMax') === undefined ? Math.max.apply(Math, values) : options.get('chartRangeMax'), target = $(this).simpledraw(width, height, options.get('composite')), vlen = values.length, lwhisker, loutlier, q1, q2, q3, rwhisker, routlier; if (target && values.length > 1) {
            var canvas_width = target.pixel_width, canvas_height = target.pixel_height; if (options.get('raw')) { if (options.get('showOutliers') && values.length > 5) { loutlier = values[0]; lwhisker = values[1]; q1 = values[2]; q2 = values[3]; q3 = values[4]; rwhisker = values[5]; routlier = values[6]; } else { lwhisker = values[0]; q1 = values[1]; q2 = values[2]; q3 = values[3]; rwhisker = values[4]; } } else {
                values.sort(function (a, b) { return a - b; }); q1 = quartile(values, 1); q2 = quartile(values, 2); q3 = quartile(values, 3); var iqr = q3 - q1; if (options.get('showOutliers')) {
                    lwhisker = undefined; rwhisker = undefined; for (var i = 0; i < vlen; i++) {
                        if (lwhisker === undefined && values[i] > q1 - (iqr * options.get('outlierIQR'))) { lwhisker = values[i]; }
                        if (values[i] < q3 + (iqr * options.get('outlierIQR'))) { rwhisker = values[i]; } 
                    }
                    loutlier = values[0]; routlier = values[vlen - 1];
                } else { lwhisker = values[0]; rwhisker = values[vlen - 1]; } 
            }
            var unitsize = canvas_width / (maxvalue - minvalue + 1), canvas_left = 0; if (options.get('showOutliers')) {
                canvas_left = Math.ceil(options.get('spotRadius')); canvas_width -= 2 * Math.ceil(options.get('spotRadius')); unitsize = canvas_width / (maxvalue - minvalue + 1); if (loutlier < lwhisker) { target.drawCircle((loutlier - minvalue) * unitsize + canvas_left, canvas_height / 2, options.get('spotRadius'), options.get('outlierLineColor'), options.get('outlierFillColor')); }
                if (routlier > rwhisker) { target.drawCircle((routlier - minvalue) * unitsize + canvas_left, canvas_height / 2, options.get('spotRadius'), options.get('outlierLineColor'), options.get('outlierFillColor')); } 
            }
            target.drawRect(Math.round((q1 - minvalue) * unitsize + canvas_left), Math.round(canvas_height * 0.1), Math.round((q3 - q1) * unitsize), Math.round(canvas_height * 0.8), options.get('boxLineColor'), options.get('boxFillColor')); target.drawLine(Math.round((lwhisker - minvalue) * unitsize + canvas_left), Math.round(canvas_height / 2), Math.round((q1 - minvalue) * unitsize + canvas_left), Math.round(canvas_height / 2), options.get('lineColor')); target.drawLine(Math.round((lwhisker - minvalue) * unitsize + canvas_left), Math.round(canvas_height / 4), Math.round((lwhisker - minvalue) * unitsize + canvas_left), Math.round(canvas_height - canvas_height / 4), options.get('whiskerColor')); target.drawLine(Math.round((rwhisker - minvalue) * unitsize + canvas_left), Math.round(canvas_height / 2), Math.round((q3 - minvalue) * unitsize + canvas_left), Math.round(canvas_height / 2), options.get('lineColor')); target.drawLine(Math.round((rwhisker - minvalue) * unitsize + canvas_left), Math.round(canvas_height / 4), Math.round((rwhisker - minvalue) * unitsize + canvas_left), Math.round(canvas_height - canvas_height / 4), options.get('whiskerColor')); target.drawLine(Math.round((q2 - minvalue) * unitsize + canvas_left), Math.round(canvas_height * 0.1), Math.round((q2 - minvalue) * unitsize + canvas_left), Math.round(canvas_height * 0.9), options.get('medianColor')); if (options.get('target')) { var size = Math.ceil(options.get('spotRadius')); target.drawLine(Math.round((options.get('target') - minvalue) * unitsize + canvas_left), Math.round((canvas_height / 2) - size), Math.round((options.get('target') - minvalue) * unitsize + canvas_left), Math.round((canvas_height / 2) + size), options.get('targetColor')); target.drawLine(Math.round((options.get('target') - minvalue) * unitsize + canvas_left - size), Math.round(canvas_height / 2), Math.round((options.get('target') - minvalue) * unitsize + canvas_left + size), Math.round(canvas_height / 2), options.get('targetColor')); } 
        } else { this.innerHTML = ''; } 
    }; if ($.browser.msie && !document.namespaces.v) { document.namespaces.add('v', 'urn:schemas-microsoft-com:vml', '#default#VML'); }
    if ($.browser.hasCanvas === undefined) { var t = document.createElement('canvas'); $.browser.hasCanvas = t.getContext !== undefined; }
    VCanvas_base = function (width, height, target) { }; VCanvas_base.prototype = { init: function (width, height, target) {
        this.width = width; this.height = height; this.target = target; if (target[0]) { target = target[0]; }
        target.VCanvas = this;
    }, drawShape: function (path, lineColor, fillColor, lineWidth) { alert('drawShape not implemented'); }, drawLine: function (x1, y1, x2, y2, lineColor, lineWidth) { return this.drawShape([[x1, y1], [x2, y2]], lineColor, lineWidth); }, drawCircle: function (x, y, radius, lineColor, fillColor) { alert('drawCircle not implemented'); }, drawPieSlice: function (x, y, radius, startAngle, endAngle, lineColor, fillColor) { alert('drawPieSlice not implemented'); }, drawRect: function (x, y, width, height, lineColor, fillColor) { alert('drawRect not implemented'); }, getElement: function () { return this.canvas; }, _insert: function (el, target) { $(target).html(el); } 
    }; VCanvas_canvas = function (width, height, target) { return this.init(width, height, target); }; VCanvas_canvas.prototype = $.extend(new VCanvas_base(), { _super: VCanvas_base.prototype, init: function (width, height, target) {
        this._super.init(width, height, target); this.canvas = document.createElement('canvas'); if (target[0]) { target = target[0]; }
        target.VCanvas = this; $(this.canvas).css({ display: 'inline-block', width: width, height: height, verticalAlign: 'top' }); this._insert(this.canvas, target); this.pixel_height = $(this.canvas).height(); this.pixel_width = $(this.canvas).width(); this.canvas.width = this.pixel_width; this.canvas.height = this.pixel_height; $(this.canvas).css({ width: this.pixel_width, height: this.pixel_height });
    }, _getContext: function (lineColor, fillColor, lineWidth) {
        var context = this.canvas.getContext('2d'); if (lineColor !== undefined) { context.strokeStyle = lineColor; }
        context.lineWidth = lineWidth === undefined ? 1 : lineWidth; if (fillColor !== undefined) { context.fillStyle = fillColor; }
        return context;
    }, drawShape: function (path, lineColor, fillColor, lineWidth) {
        var context = this._getContext(lineColor, fillColor, lineWidth); context.beginPath(); context.moveTo(path[0][0] + 0.5, path[0][1] + 0.5); for (var i = 1, plen = path.length; i < plen; i++) { context.lineTo(path[i][0] + 0.5, path[i][1] + 0.5); }
        if (lineColor !== undefined) { context.stroke(); }
        if (fillColor !== undefined) { context.fill(); } 
    }, drawCircle: function (x, y, radius, lineColor, fillColor) {
        var context = this._getContext(lineColor, fillColor); context.beginPath(); context.arc(x, y, radius, 0, 2 * Math.PI, false); if (lineColor !== undefined) { context.stroke(); }
        if (fillColor !== undefined) { context.fill(); } 
    }, drawPieSlice: function (x, y, radius, startAngle, endAngle, lineColor, fillColor) {
        var context = this._getContext(lineColor, fillColor); context.beginPath(); context.moveTo(x, y); context.arc(x, y, radius, startAngle, endAngle, false); context.lineTo(x, y); context.closePath(); if (lineColor !== undefined) { context.stroke(); }
        if (fillColor) { context.fill(); } 
    }, drawRect: function (x, y, width, height, lineColor, fillColor) { return this.drawShape([[x, y], [x + width, y], [x + width, y + height], [x, y + height], [x, y]], lineColor, fillColor); } 
    }); VCanvas_vml = function (width, height, target) { return this.init(width, height, target); }; VCanvas_vml.prototype = $.extend(new VCanvas_base(), { _super: VCanvas_base.prototype, init: function (width, height, target) {
        this._super.init(width, height, target); if (target[0]) { target = target[0]; }
        target.VCanvas = this; this.canvas = document.createElement('span'); $(this.canvas).css({ display: 'inline-block', position: 'relative', overflow: 'hidden', width: width, height: height, margin: '0px', padding: '0px', verticalAlign: 'top' }); this._insert(this.canvas, target); this.pixel_height = $(this.canvas).height(); this.pixel_width = $(this.canvas).width(); this.canvas.width = this.pixel_width; this.canvas.height = this.pixel_height; var groupel = '<v:group coordorigin="0 0" coordsize="' + this.pixel_width + ' ' + this.pixel_height + '"' + ' style="position:absolute;top:0;left:0;width:' + this.pixel_width + 'px;height=' + this.pixel_height + 'px;"></v:group>'; this.canvas.insertAdjacentHTML('beforeEnd', groupel); this.group = $(this.canvas).children()[0];
    }, drawShape: function (path, lineColor, fillColor, lineWidth) {
        var vpath = []; for (var i = 0, plen = path.length; i < plen; i++) { vpath[i] = '' + (path[i][0]) + ',' + (path[i][1]); }
        var initial = vpath.splice(0, 1); lineWidth = lineWidth === undefined ? 1 : lineWidth; var stroke = lineColor === undefined ? ' stroked="false" ' : ' strokeWeight="' + lineWidth + '" strokeColor="' + lineColor + '" '; var fill = fillColor === undefined ? ' filled="false"' : ' fillColor="' + fillColor + '" filled="true" '; var closed = vpath[0] == vpath[vpath.length - 1] ? 'x ' : ''; var vel = '<v:shape coordorigin="0 0" coordsize="' + this.pixel_width + ' ' + this.pixel_height + '" ' +
stroke +
fill + ' style="position:absolute;left:0px;top:0px;height:' + this.pixel_height + 'px;width:' + this.pixel_width + 'px;padding:0px;margin:0px;" ' + ' path="m ' + initial + ' l ' + vpath.join(', ') + ' ' + closed + 'e">' + ' </v:shape>'; this.group.insertAdjacentHTML('beforeEnd', vel);
    }, drawCircle: function (x, y, radius, lineColor, fillColor) {
        x -= radius + 1; y -= radius + 1; var stroke = lineColor === undefined ? ' stroked="false" ' : ' strokeWeight="1" strokeColor="' + lineColor + '" '; var fill = fillColor === undefined ? ' filled="false"' : ' fillColor="' + fillColor + '" filled="true" '; var vel = '<v:oval ' +
stroke +
fill + ' style="position:absolute;top:' + y + 'px; left:' + x + 'px; width:' + (radius * 2) + 'px; height:' + (radius * 2) + 'px"></v:oval>'; this.group.insertAdjacentHTML('beforeEnd', vel);
    }, drawPieSlice: function (x, y, radius, startAngle, endAngle, lineColor, fillColor) {
        if (startAngle == endAngle) { return; }
        if ((endAngle - startAngle) == (2 * Math.PI)) { startAngle = 0.0; endAngle = (2 * Math.PI); }
        var startx = x + Math.round(Math.cos(startAngle) * radius); var starty = y + Math.round(Math.sin(startAngle) * radius); var endx = x + Math.round(Math.cos(endAngle) * radius); var endy = y + Math.round(Math.sin(endAngle) * radius); if (startx == endx && starty == endy && (endAngle - startAngle) < Math.PI) { return; }
        var vpath = [x - radius, y - radius, x + radius, y + radius, startx, starty, endx, endy]; var stroke = lineColor === undefined ? ' stroked="false" ' : ' strokeWeight="1" strokeColor="' + lineColor + '" '; var fill = fillColor === undefined ? ' filled="false"' : ' fillColor="' + fillColor + '" filled="true" '; var vel = '<v:shape coordorigin="0 0" coordsize="' + this.pixel_width + ' ' + this.pixel_height + '" ' +
stroke +
fill + ' style="position:absolute;left:0px;top:0px;height:' + this.pixel_height + 'px;width:' + this.pixel_width + 'px;padding:0px;margin:0px;" ' + ' path="m ' + x + ',' + y + ' wa ' + vpath.join(', ') + ' x e">' + ' </v:shape>'; this.group.insertAdjacentHTML('beforeEnd', vel);
    }, drawRect: function (x, y, width, height, lineColor, fillColor) { return this.drawShape([[x, y], [x, y + height], [x + width, y + height], [x + width, y], [x, y]], lineColor, fillColor); } 
    });
})(jQuery);
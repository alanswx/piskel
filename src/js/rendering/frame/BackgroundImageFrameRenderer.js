  function parseColor2(color) {
    color = color.trim().toLowerCase();
    //color = _colorsByName[color] || color;
    var hex3 = color.match(/^#([0-9a-f]{3})$/i);
    if (hex3) {
      hex3 = hex3[1];
      return [
        parseInt(hex3.charAt(0),16) * 0x11,
        parseInt(hex3.charAt(1),16) * 0x11,
        parseInt(hex3.charAt(2),16) * 0x11, 1
      ];
    }
    var hex6 = color.match(/^#([0-9a-f]{6})$/i);
    if (hex6) {
      hex6 = hex6[1];
      return [
        parseInt(hex6.substr(0,2),16),
        parseInt(hex6.substr(2,2),16),
        parseInt(hex6.substr(4,2),16), 1
      ];
    }
    var rgba = color.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+.*\d*)\s*\)$/i)  ||
       color.match(/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (rgba) {
      return [rgba[1],rgba[2],rgba[3], rgba[4] === undefined ? 1 : rgba[4]];
    }
    var rgb = color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (rgb) {
      return [rgb[1],rgb[2],rgb[3],1];
    }
  }

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? '0' + hex : hex;
}

(function () {
  var ns = $.namespace('pskl.rendering.frame');

  ns.BackgroundImageFrameRenderer = function (container, zoom) {
    this.container = container;
    this.setZoom(zoom);

    var containerEl = container.get(0);
    var containerDocument = containerEl.ownerDocument;
    this.frameContainer = containerDocument.createElement('div');
    this.frameContainer.classList.add('background-image-frame-container');
    container.get(0).appendChild(this.frameContainer);

    this.cachedFrameProcessor = new pskl.model.frame.CachedFrameProcessor();
    this.cachedFrameProcessor.setFrameProcessor(this.frameToDataUrl_.bind(this));
  };

  ns.BackgroundImageFrameRenderer.prototype.frameToDataUrl_ = function (frame) {
    var canvas;
    if (frame instanceof pskl.model.frame.RenderedFrame) {
      canvas = pskl.utils.ImageResizer.scale(frame.getRenderedFrame(), this.zoom);
    } else {
      canvas = pskl.utils.FrameUtils.toImage(frame, this.zoom);
    }
    return canvas.toDataURL('image/png');
  };

  ns.BackgroundImageFrameRenderer.prototype.render = function (frame) {
    var imageSrc = this.cachedFrameProcessor.get(frame, this.zoom);
    this.frameContainer.style.backgroundImage = 'url(' + imageSrc + ')';
    var pixels = '';

    for (var y = 0 ; y < frame.height ; y++) {
      for (var x = 0 ; x < frame.width ; x++) {
        var newcolor = parseColor2(frame.pixels[x][y]);
        pixels += componentToHex(newcolor[0]) + componentToHex(newcolor[1]) + componentToHex(newcolor[2]);
      }
    }

    $.post('/setpixels', {width: frame.width,
       height: frame.height,
       pixels: pixels});
  };

  ns.BackgroundImageFrameRenderer.prototype.show = function () {
    if (this.frameContainer) {
      this.frameContainer.style.display = 'block';
    }
  };

  ns.BackgroundImageFrameRenderer.prototype.setZoom = function (zoom) {
    this.zoom = zoom;
  };

  ns.BackgroundImageFrameRenderer.prototype.getZoom = function () {
    return this.zoom;
  };

  ns.BackgroundImageFrameRenderer.prototype.setRepeated = function (repeat) {
    var repeatValue;
    if (repeat) {
      repeatValue = 'repeat';
    } else {
      repeatValue = 'no-repeat';
    }
    this.frameContainer.style.backgroundRepeat = repeatValue;
  };
})();

(function() {
  var badAngleDeltaCount, canvas, colorTable, context, cvsContainer, drawPolygon, height, i, mouseElement, mouseEvent, mouseMove, path, polygons, projection, radians, renderNexrad, renders, shadeColor, strokeTable, totalRenderTime, width, zoomScale;

  radians = function(degrees) {
    return degrees * (Math.PI / 180);
  };

  drawPolygon = function(polygon, color, stroke) {
    var poly, v1, v2, v3, v4, v5, v6, v7, v8;
    if (polygon.length < 3) {
      return console.log('Bad Polygon');
    } else {
      v1 = isNaN(polygon[0][0]) ? 0 : polygon[0][0];
      v2 = isNaN(polygon[0][1]) ? 0 : polygon[0][1];
      v3 = isNaN(polygon[1][0]) ? 0 : polygon[1][0];
      v4 = isNaN(polygon[1][1]) ? 0 : polygon[1][1];
      v5 = isNaN(polygon[2][0]) ? 0 : polygon[2][0];
      v6 = isNaN(polygon[2][1]) ? 0 : polygon[2][1];
      v7 = isNaN(polygon[3][0]) ? 0 : polygon[3][0];
      v8 = isNaN(polygon[3][1]) ? 0 : polygon[3][1];
      poly = [
        {
          x: v1,
          y: v2
        }, {
          x: v3,
          y: v4
        }, {
          x: v5,
          y: v6
        }, {
          x: v7,
          y: v8
        }
      ];
      cvsContainer.beginPath();
      cvsContainer.moveTo(v1, v2);
      cvsContainer.lineTo(v3, v4);
      cvsContainer.lineTo(v5, v6);
      cvsContainer.lineTo(v7, v8);
      cvsContainer.closePath();
      cvsContainer.fillStyle = color;
      return cvsContainer.fill();
    }
  };

  renderNexrad = function(data) {
    var now, polyCount;
    now = Date.now();
    polyCount = 0;
    _.each(data.symbology.radial, function(radial, i) {
      var angleDelta, radialAngle, radialPosition;
      radialPosition = 0;
      angleDelta = radial.angledelta || 1;
      radialAngle = radial.startangle;
      return _.each(radial.colorValues, function(colorValue, idx) {
        var polygon;
        if (colorValue > 0) {
          polygon = [];
          polygon.push([(Math.cos(radians(radialAngle - 90)) * radialPosition * zoomScale) + (width / 2.0), (Math.sin(radians(radialAngle - 90)) * radialPosition * zoomScale) + (height / 2.0)]);
          polygon.push([(Math.cos(radians((radialAngle - 90) + angleDelta)) * radialPosition * zoomScale) + (width / 2.0), (Math.sin(radians((radialAngle - 90) + angleDelta)) * radialPosition * zoomScale) + (height / 2.0)]);
          polygon.push([(Math.cos(radians((radialAngle - 90) + angleDelta)) * (radialPosition + 1) * zoomScale) + (width / 2.0), (Math.sin(radians((radialAngle - 90) + angleDelta)) * (radialPosition + 1) * zoomScale) + (height / 2.0)]);
          polygon.push([(Math.cos(radians(radialAngle - 90)) * (radialPosition + 1) * zoomScale) + (width / 2.0), (Math.sin(radians(radialAngle - 90)) * (radialPosition + 1) * zoomScale) + (height / 2.0)]);
          drawPolygon(polygon, colorTable[colorValue], strokeTable[colorValue]);
          polyCount++;
        }
        return radialPosition++;
      });
    });
    return {
      polyCount: polyCount,
      renderTimer: Date.now() - now
    };
  };

  shadeColor = function(color, percent) {
    var B, G, R, f, p, t;
    f = parseInt(color.slice(1), 16);
    t = percent < 0 ? 0 : 255;
    p = percent < 0 ? percent * -1 : percent;
    R = f >> 16;
    G = f >> 8 & 0x00FF;
    B = f & 0x0000FF;
    return '#' + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 + (Math.round((t - G) * p) + G) * 0x100 + Math.round((t - B) * p) + B).toString(16).slice(1);
  };

  i = 0;

  polygons = [];

  mouseMove = false;

  mouseEvent = null;

  mouseElement = null;

  badAngleDeltaCount = 0;

  zoomScale = 1;

  width = window.innerWidth - 50;

  height = window.innerHeight - 50;

  colorTable = ['#000000', '#000D00', '#012402', '#065108', '#1CBB20', '#26ED2B', '#FFFD38', '#F6CD2E', '#FDAC2A', '#FD8424', '#BD0711', '#FC0D1B', '#FC6467', '#FD96CD', '#FC28FC', '#FFFFFF'];

  strokeTable = [shadeColor('#000000', -0.15), shadeColor('#000D00', -0.15), shadeColor('#012402', -0.15), shadeColor('#065108', -0.15), shadeColor('#1CBB20', -0.15), shadeColor('#26ED2B', -0.15), shadeColor('#FFFD38', -0.15), shadeColor('#F6CD2E', -0.15), shadeColor('#FDAC2A', -0.15), shadeColor('#FD8424', -0.15), shadeColor('#BD0711', -0.15), shadeColor('#FC0D1B', -0.15), shadeColor('#FC6467', -0.15), shadeColor('#FD96CD', -0.15), shadeColor('#FC28FC', -0.15), shadeColor('#FFFFFF', -0.15)];

  totalRenderTime = 0;

  canvas = d3.select('body').append('canvas').attr('id', 'map').attr('width', width).attr('height', height);

  context = canvas.node().getContext('2d');

  context.lineJoin = 'round';

  context.lineCap = 'round';

  context.strokeStyle = '#FFFFFF';

  cvsContainer = d3.select('body').append('canvas').attr('id', 'radar').attr('width', width).attr('height', height).node().getContext('2d');

  projection = d3.geoMercator().translate([width / 2, height / 2]).center([-97.278, 35.333]).scale(3000);

  path = d3.geoPath(projection).context(context);

  d3.json('counties.json', function(error, us) {
    var counties, land, states;
    if (error) {
      throw error;
    }
    land = topojson.feature(us, us.objects.land);
    counties = topojson.mesh(us, us.objects.counties, function(a, b) {
      return a !== b && !(a.id / 1000 ^ b.id / 1000);
    });
    states = topojson.mesh(us, us.objects.states, function(a, b) {
      return a !== b;
    });
    context.translate(0, 0);
    context.scale(1, 1);
    context.beginPath();
    path(land);
    context.fillStyle = '#000000';
    context.lineWidth = 1;
    context.strokeStyle = '#FFFFFF';
    context.stroke();
    context.fill();
    context.beginPath();
    path(counties);
    context.lineWidth = 0.1;
    context.strokeStyle = '#FFFFFF';
    context.stroke();
    context.beginPath();
    path(states);
    context.lineWidth = 0.5;
    context.strokeStyle = '#FFFFFF';
    context.stroke();
    return d3.select('#radar').call(d3.zoom().scaleExtent([1, 25]).on('zoom', function() {
      cvsContainer.save();
      cvsContainer.clearRect(0, 0, width, height);
      cvsContainer.translate(d3.event.transform.x, d3.event.transform.y);
      cvsContainer.scale(d3.event.transform.k, d3.event.transform.k);
      renderNexrad(nx0);
      cvsContainer.restore();
      context.save();
      context.clearRect(0, 0, width, height);
      context.translate(d3.event.transform.x, d3.event.transform.y);
      context.scale(d3.event.transform.k, d3.event.transform.k);
      context.beginPath();
      path(land);
      context.fillStyle = '#000000';
      context.lineWidth = 1;
      context.strokeStyle = '#FFFFFF';
      context.stroke();
      context.fill();
      context.beginPath();
      path(counties);
      context.lineWidth = 0.1;
      context.strokeStyle = '#FFFFFF';
      context.stroke();
      context.beginPath();
      path(states);
      context.lineWidth = 0.5;
      context.strokeStyle = '#FFFFFF';
      context.stroke();
      return context.restore();
    }));
  });

  d3.select(self.frameElement).style("height", height + "px");

  renders = renderNexrad(nx0);

}).call(this);

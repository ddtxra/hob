
function drawHighcharts(_div, positive_hemocultures){

    var categories = _.uniq(positive_hemocultures.map(ph => ph.patient_id + "@" + ph.stay_id));
    var data = [];
    for(var c=0; c<categories.length; c++){
        var cat = categories[c];
        var pos_hemo_for_cat = positive_hemocultures.filter(pc => (pc.patient_id + "@" + pc.stay_id) == cat);
        pos_hemo_for_cat.forEach(function (phc){
            data.push({
                start: phc.labo_sample_datetime_timestamp + 12*60*60*1000,
                y: c,
                customSymbol: phc.labo_commensal == "1" ? 'triangle' : (phc.labo_commensal == "0" ? "diamond" : "square"),
                milestone: true,
                name: phc.labo_germ_name,
                color: getColorFromPalette(phc.labo_germ_name),
                label: "test"+c
            })
        })
    }

    (function(H) {
        var isNumber = H.isNumber,
          XRangeSeries = H.seriesTypes.xrange;
      
        H.seriesTypes.gantt.prototype.drawPoint = function(point, verb) {
          var series = this,
            seriesOpts = series.options,
            renderer = series.chart.renderer,
            shapeArgs = point.shapeArgs,
            plotY = point.plotY,
            graphic = point.graphic,
            state = point.selected && 'select',
            cutOff = seriesOpts.stacking && !seriesOpts.borderRadius,
            diamondShape;
          if (point.options.milestone) {
            if (isNumber(plotY) && point.y !== null && point.visible !== false) {
      
              diamondShape = renderer.symbols[point.options.customSymbol](
                shapeArgs.x || 0,
                shapeArgs.y || 0,
                shapeArgs.width || 0,
                shapeArgs.height || 0
              );
              if (graphic) {
                graphic[verb]({
                  d: diamondShape
                });
              } else {
                point.graphic = graphic = renderer.path(diamondShape)
                  .addClass(point.getClassName(), true)
                  .add(point.group || series.group);
              }
              // Presentational
              if (!series.chart.styledMode) {
                point.graphic
                  .attr(series.pointAttribs(point, state))
                  .shadow(seriesOpts.shadow, null, cutOff);
              }
            } else if (graphic) {
              point.graphic = graphic.destroy(); // #1269
            }
          } else {
            XRangeSeries.prototype.drawPoint.call(series, point, verb);
          }
      
        };
      })(Highcharts)

    var series = [];
    var seriesName = _.groupBy(data, "name");
    Object.keys(seriesName).forEach(function (s){
        series.push({name: s, data: seriesName[s]})
    })

    Highcharts.ganttChart(_div, {
        legend: {
            enabled: true,
        squareSymbol: false,
        symbolRadius: 0,
          },
        chart: {
            zoomType: 'x',
            panning: {
              enabled: true,
              type: 'x',
            },
            panKey: 'shift',
          },
        yAxis: {
            categories: categories
        },
        xAxis: [{
            labels: {
                formatter(event) {
                 return moment(event.pos).format("DD")
                }
              }
        }, {
            visible: false,
            opposite: false
        }],
        series:  series
    });

    }
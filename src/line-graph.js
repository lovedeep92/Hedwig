import * as d3 from 'd3';
import "d3-selection-multi";
import { Defaults } from './defaults'; 
import { AxisLeft } from './helpers/axisConverter';
import * as styleSheet from  './styles/main.css';

import { Helper } from "./Helper";
/**
 * @name LineGraph
 * @description
 * @extends HTMLElement
 * Generic line graph component for reusability
 */

export class LineGraph extends HTMLElement {

  constructor() {
    super();
    this.lineColor = [];
  }

  /**
   * @name connectedCallback
   * @description
   * Call back for when the component is attached to the DOM
   */
  connectedCallback() {

    let id = 'hedwig-' + btoa(Math.random()).substr(5, 5);
    this.innerHTML = `<style>${styleSheet}</style><svg id='${id}'></svg>`;
    var svg = document.querySelector(`#${id}`);
    var data = JSON.parse(this.dataset.graph);

    this.attachShadow({
      mode: 'open'
    });
    this.shadowRoot.appendChild(svg);
    this.renderGraph(this.parseData(data), svg);
  }

  /**
   * @name parseData
   * @param {Array} data
   * @description
   * Parses data into an array and converts dates into
   * javascript date objects which is required for d3js
   */
  parseData(data) {
    let uniqueGroups = [];
    let grouping = this.dataset.group;
    // get color array 
    this.getDataLineColor(this.dataset.lineColor);
    data.map((item) => {
      // if grouping is specified find unique groups
      let group = item[grouping];
      const index = uniqueGroups.findIndex((i) => i === group);
      if (index === -1) {
        uniqueGroups.push(group);
      }
    });
    // now that we have grouping we will filter and map our datapoints
    return uniqueGroups.map((group, index) => {
      return {
        group,
        datapoints: data.filter(d => d[grouping] === group).map((d) => {
          return {
            time: new Date(d.time),
            value: +d.mean
          }
        }),
        color: this.lineColor[index]
      }
    });


  }

  /**
   * @name getDataLineColor
   * @description // create function to return random color array for each line.
   */

  getDataLineColor(colors) {
    var arr = [];
    var arrColor;
    var defaults = new Defaults();
    colors.split(',').map(value => arr.push(value));
    arrColor = [...arr, ...defaults.schemeCategory10Color];
    this.lineColor.push.apply(this.lineColor, arrColor);
  }

  /**
   * @name disconnectedCallback
   * @description
   * Call back for when the component is detached from the DOM
   */
  disconnectedCallback() {}

  /**
   * @name renderGraph
   * @param {Array} data
   * @param {innerHTML} el
   * @description
   * Renders the graph using d3js
   */
  renderGraph(data, el) {
    var helper= new Helper();
    // Setup the margins and height, width
    var margin = JSON.parse(this.dataset.margin);
    var height = parseInt(this.dataset.height);
    var width = parseInt(this.dataset.width);
    var unit = this.dataset.unit;

   // Create X time scale
   var xScale = d3.scaleTime()
   .domain(d3.extent(helper.maxTime(data)))
   .range([0, width - margin.bottom]);

 // Create Y linear scale
 var yScale = d3.scaleLinear()
   .domain(d3.extent(helper.maxValue(data)))
   .range([height - margin.left, 0]);
 
    // create color scale for each line

    // Define a div and add styling for tooltip
    var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    // Setup the svg element in the DOM
    var svg = d3.select(el)
      .styles({
        "width": width + margin.left + +margin.right,
        "height": height + +margin.top + +margin.bottom
      })
      .append('g')
      .attr("transform", `translate(${margin.top}, ${margin.left})`);

    // Create the lines
    var line = d3.line()
      .x(d => xScale(d.time))
      .y(d => yScale(d.value));

    // add element for line and add class name
    let lines = svg.append('g')
      .attr('class', 'lines');
      // create g tag with path having class line-group and line.
      lines.selectAll('.line-group')
      .data(data).enter()
      .append('g')
      .attr('class', 'line-group')
      .append('path')
      .attrs({'class':'line', 'd': d => line(d.datapoints)})
      .styles({'stroke':d => d.color, 'fill':'none'})
      .each((d, i) => { // loop through datapoints to fetch time and value to create tooltip hover events with value.
        lines.selectAll('dot')
          .data(d.datapoints)
          .enter()
          .append("circle")
          .attrs({"r": 4, "cx": function(d) { return xScale(d.time); }, "cy": function(d) { return yScale(d.value); }})
          .styles({"opacity": 0, "stroke": d.color, "fill": "none", "stroke-width": "2px"})
          .on("mouseover", function(d) {
           d3.select(this)
              .transition()
              .duration(200)
              .style("opacity", 0.9); // add opacity in case of hover		
            div.transition()
              .duration(200)
              .style("opacity", .9);
            div.html(d.time + "<br/>" + d.value)
              .styles({
                "left": (d3.event.pageX + 10) + "px",
                "top": (d3.event.pageY - 28) + "px",
                "pointer-events": "none"
              });
          })
          .on("mouseout", function (d) {
            d3.select(this)
              .transition()
              .duration(200)
              .style("opacity", 0); // Remove hover in case of mouse out
            div.transition()
              .duration(500)
              .style("opacity", 0);
          });
      });

    // Configure X Axis ticks and add xScale
    var xAxis = d3.axisBottom(xScale).ticks(5);
    // Configure Y Axis ticks and
    var yAxis = d3.axisLeft(yScale).ticks(5).tickFormat((d) => {
      return new AxisLeft().convert(unit, d);
    });


    // Add both Axis' to the SVG
    svg.append("g")
      .attrs({"class": "x axis", "transform": `translate(0, ${height - margin.top})`})
      .call(xAxis);

    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append('text')
      .attrs({"y": 15, "transform": "rotate(-90)", "fill": "#000"})
    this.setLegend(svg, height, data)
    
  }

  setTitle(svg, width) {
    if (this.dataset.title !== 'undefined') {
      svg.append("text")
        .attr("transform", `translate(-14, -23)`)
        .attr("x", width / 2)
        .attr("y", 0)
        .style("text-anchor", "middle")
        .style("font-size", 12)
        .text(this.dataset.title);
    }
  }

  /**
   * 
   * @param {d3 svg element} svg 
   * @param {height} height 
   * @param {data} data 
   */
  setLegend(svg, height, data) {
    var legend = svg.append("g")
      .attrs({"class": "legend", 'transform': `translate(0,${height-50})`}) 
      // create rectangle for legends
    legend.selectAll('rect')
      .data(data)
      .enter()
      .append("rect")
      .attrs({"x": 18, "y": (d, i) => {
        return i * 20 + 30;
      }, "width": 10, "height": 10 })
      .style("fill", (d) => {
        return d.color;
      })
    // set text of legends
    legend.selectAll('text')
      .data(data)
      .enter()
      .append("text")
      .styles({"font-size":12})
      .attrs({"x":36, "y": (d, i) => {
        return i * 20 + 38;
      }})
      .text((d) => {
        if (d.group) {
          return d.group;
        } else {
          return this.dataset.field
        }
      });
  }

}

customElements.define('line-graph', LineGraph);

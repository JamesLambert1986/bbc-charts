import { ucfirst, unsnake } from './helpers.js'

function chart(chartElement,min,max,type,guidelines) {

  const chartID = `chart-${Date.now()}`;
  let table = chartElement.querySelector('table');

  if(typeof min == 'undefined'){
    min = chartElement.getAttribute('data-min');
  }
  if(typeof max == 'undefined'){
    max = chartElement.getAttribute('data-max');
  }
  if(typeof type == 'undefined'){
    type = chartElement.getAttribute('data-type') ? chartElement.getAttribute('data-type') : 'bar';
  }
  if(typeof guidelines == 'undefined' && chartElement.hasAttribute('data-guidelines')){
    guidelines = chartElement.getAttribute('data-guidelines').split(',');
  }


  // Wrap the table with some divs to add functionality
  if(!chartElement.querySelector('.table__wrapper')){

    const tableWrapper = document.createElement('div');
    tableWrapper.setAttribute('class','table__wrapper');

    chartElement.append(tableWrapper);
    tableWrapper.append(table);
  }

  if(!chartElement.querySelector('.chart__inner')){

    const tableWrapper = chartElement.querySelector('.table__wrapper');
    const chartInner = document.createElement('div');
    chartInner.setAttribute('class','chart__inner');

    chartInner.append(tableWrapper);
    chartElement.append(chartInner);
  }

  // Create chart key if the one isn't already created
  if(!chartElement.querySelector('.chart__key')){
    createChartKey(chartID,chartElement);
  }

  // Create the required type input field if one isn't set
  if(!chartElement.querySelector(':scope > [type="radio"]:checked')){
    createChartType(chartID,chartElement,type);
  }


  // Y Axis and Guidelines
  if(guidelines){
    createChartYaxis(chartElement,min,max,guidelines);
    createChartGuidelines(chartElement,min,max,guidelines);
  }

  // Make sure table cells have enough data attached to them to display the chart data
  Array.from(chartElement.querySelectorAll('tbody tr')).forEach((tr, index) => {

    let group = tr.querySelector('td:first-child, th:first-child') ? tr.querySelector('td:first-child, th:first-child').innerHTML : '';

    // Set the data numeric value if not set
    Array.from(tr.querySelectorAll('td:not([data-numeric]):not(:first-child)')).forEach((td, index) => {
      td.setAttribute('data-numeric',parseFloat(td.innerHTML.replace('£','')));
    });

    // Set the data label value if not set
    Array.from(tr.querySelectorAll('td:not([data-label])')).forEach((td, index) => {

      td.setAttribute('data-label',chartElement.querySelectorAll('thead th')[index].innerHTML);
    });

    // Add css vars to cells
    Array.from(tr.querySelectorAll('td[data-numeric]:not([data-numeric="0"]):not(:first-child)')).forEach((td, index) => {

      
      const label = td.getAttribute('data-label');
      const content = td.innerHTML;

      if(!td.querySelector('span[data-group]'))
        td.innerHTML = `<span data-group="${group}" data-label="${label}">${content}</span>`;

      if(!td.hasAttribute('style')){
        

        const value = Number.parseFloat(td.getAttribute('data-numeric'));
        let percent = ((value - min)/(max)) * 100;
        let bottom = 0;

        // If the value is negative the position below the 0 line
        if(min < 0){
          bottom = Math.abs((min)/(max)*100);
          if(value < 0){
            bottom = bottom - percent;
          }
        }
        td.setAttribute("style",`--bottom:${bottom}%;--percent:${percent}%;`);
      }


    });
  });

  // Create lines for line graph
  if(chartElement.querySelector(':scope > input[value="line"]:checked'))
    createLines(chartElement,min,max);

  // Create pies
  if(chartElement.querySelector(':scope > input[value="pie"]:checked'))
    createPies(chartElement);

  // Event handlers
  const showData = chartElement.querySelectorAll(':scope > input[type="checkbox"]');

  for (var i = 0; i < showData.length; i++) {
    showData[i].addEventListener('change', function() {
      
      if(chartElement.querySelector(':scope > input[value="pie"]:checked'))
        createPies(chartElement);
    });
  }

  if(chartElement.querySelector(':scope > input[type="radio"]')){

    const chartTypes = chartElement.querySelectorAll(':scope > input[type="radio"]');

    for (var i = 0; i < chartTypes.length; i++) {
      chartTypes[i].addEventListener('change', function() {
          
        switch(this.value){
          case "line":
            createLines(chartElement,min,max)
            break;
          case "pie":
            createPies(chartElement)
            break;
        }
      });
    }

  }
}

export const createChartKey = function(chartID, chartElement){

  let chartKey = document.createElement("div");
  chartKey.setAttribute('class','chart__key');
  chartKey.setAttribute('role','presentation');

  chartElement.prepend(chartKey);

  Array.from(chartElement.querySelectorAll('thead th')).forEach((arrayElement, index) => {

    if(index != 0){

      let input = document.createElement('input');
      input.setAttribute('name',`${chartID}-dataset-${index}`);
      input.setAttribute('id',`${chartID}-dataset-${index}`);
      input.setAttribute('checked',`checked`);
      input.setAttribute('type',`checkbox`);


      chartElement.insertBefore(input,chartKey);

      let label = document.createElement('label');
      label.setAttribute('class',`key`);
      label.setAttribute('for',`${chartID}-dataset-${index}`);
      label.innerHTML = `${arrayElement.innerText}`;

      chartKey.append(label);

    }
  });
}

export const createChartType = function(chartID,chartElement,type){

  const chartInner = chartElement.querySelector('.chart__inner');
  const chartType = document.createElement('input');

  chartType.setAttribute('type','radio');
  chartType.setAttribute('name',`${chartID}-type`);
  chartType.value = type;
  chartType.setAttribute('checked','checked');

  chartElement.insertBefore(chartType, chartInner);
}


export const createChartYaxis = function(chartElement,min,max,guidelines){

  const chartInner = chartElement.querySelector('.chart__inner');

  const chartYaxis = document.createElement('div');
  chartYaxis.setAttribute('class','chart__yaxis');

  for (var i = 0; i < guidelines.length; i++) {

    const value = parseFloat(guidelines[i].replace('£',''));
    const percent = (100 * value) / max;

    chartYaxis.innerHTML += `<div class="axis__point" style="--percent:${percent}%;"><span>${guidelines[i]}</span></div>`;
    
  }

  chartInner.prepend(chartYaxis);
}

export const createChartGuidelines = function(chartElement,min,max,guidelines){

  const tableWrapper = chartElement.querySelector('.table__wrapper');

  const chartGuidelines = document.createElement('div');
  chartGuidelines.setAttribute('class','chart__guidelines');

  for (var i = 0; i < guidelines.length; i++) {

    const value = parseFloat(guidelines[i].replace('£',''));
    const percent = (100 * value) / max;

    chartGuidelines.innerHTML += `<div class="guideline" style="--percent:${percent}%;"></div>`;
  }

  tableWrapper.prepend(chartGuidelines);

}


function getCoordinatesForPercent(percent) {
  const x = Math.cos(2 * Math.PI * percent);
  const y = Math.sin(2 * Math.PI * percent);
  return [x*100, y*100];
}

export const createPies = function(chartElement){

  let returnString = '';


  let chartInner = chartElement.querySelector('.chart__inner');

  let pieWrapper = chartElement.querySelector('.pies');

  if(!pieWrapper){

    pieWrapper = document.createElement("div");
    pieWrapper.setAttribute('class','pies');

    chartInner.append(pieWrapper);

  }


  Array.from(chartElement.querySelectorAll('tbody tr')).forEach((item, index) => {

    let paths = '';
    let tooltips = '';
    let cumulativePercent = 0;
    let total = 0;
    let titleKey = item.querySelectorAll('td')[0]
    let title = titleKey.innerHTML;

    // Work out the total amount
    Array.from(item.querySelectorAll('td')).forEach((cell, subindex) => {

      const display = getComputedStyle(cell).display;

      if(subindex != 0 && display != 'none'){

        let value = cell.getAttribute('data-numeric');

        value = value.replace('£','');
        value = value.replace('%','');
        value = Number.parseInt(value);

        total += value;
      }
    });

    // Create the paths
    Array.from(item.querySelectorAll('td')).forEach((cell, subindex) => {

      const display = getComputedStyle(cell).display;

      if(subindex != 0 && display != 'none'){

        let value = cell.getAttribute('data-numeric');

        value = value.replace('£','');
        value = value.replace('%','');
        value = Number.parseInt(value);

        let percent = value/total;

        const [startX, startY] = getCoordinatesForPercent(cumulativePercent);

        // each slice starts where the last slice ended, so keep a cumulative percent
        cumulativePercent += percent;

        const [endX, endY] = getCoordinatesForPercent(cumulativePercent);

        // if the slice is more than 50%, take the large arc (the long way around)
        const largeArcFlag = percent > .5 ? 1 : 0;

        // create an array and join it just for code readability
        const pathData = [
          `M ${startX} ${startY}`, // Move
          `A 100 100 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arc
          `L 0 0`, // Line
        ].join(' ');

        paths += `<path d="${pathData}"></path>`;
        tooltips += `<foreignObject x="-70" y="-70" width="140" height="140" style="transform: rotate(90deg)"><div><span class="h5 mb-0"><span class="total d-block">${ucfirst(unsnake(title))}</span> ${ucfirst(unsnake(cell.getAttribute('data-label')))}<br/> ${cell.innerHTML}</span></div></foreignObject>`;
      }
    });

    returnString += `<div class="pie"><svg viewBox="-105 -105 210 210" style="transform: rotate(-90deg)" preserveAspectRatio="none">${paths}<foreignObject x="-70" y="-70" width="140" height="140" style="transform: rotate(90deg)"><div><span class="h5 mb-0">${title}</span></div></foreignObject>${tooltips}</svg></div>`
  });

  pieWrapper.innerHTML = returnString;
}

export const createLines = function(chartElement,min,max){


  let returnString = '';

  let tableWrapper = chartElement.querySelector('.table__wrapper');

  let linesWrapper = chartElement.querySelector('.lines');

  if(!linesWrapper){

    linesWrapper = document.createElement("div");
    linesWrapper.setAttribute('class','lines');

    tableWrapper.prepend(linesWrapper);

  }


  let items = Array.from(chartElement.querySelectorAll('tbody tr'));

  let lines = Array();
  let spacer = 200/(items.length - 1);

  // Creates the lines array from the fields array
  Array.from(chartElement.querySelectorAll('thead th')).forEach((field, index) => {

    if(index != 0){

      lines[index-1] = '';
    }
  });

  // populate the lines array from the items array
  Array.from(chartElement.querySelectorAll('tbody tr')).forEach((item, index) => {

    Array.from(item.querySelectorAll('td')).forEach((cell, subindex) => {

      if(subindex != 0){

        let value = cell.getAttribute('data-numeric');

        value = value.replace('£','');
        value = value.replace('%','');
        value = Number.parseFloat(value) - min;

        const percent = (value/max) * 100;

        let command = index == 0 ? 'M' : 'L';

        lines[subindex-1] += `${command} ${spacer * index} ${100-percent} `;
      }
    });
  });

  lines.forEach((line, index) => {

    returnString += `
<svg viewBox="0 0 200 100" class="line" preserveAspectRatio="none">
  <path fill="none" d="${line}"></path>
</svg>`
  });

  linesWrapper.innerHTML = returnString;
}

export default chart
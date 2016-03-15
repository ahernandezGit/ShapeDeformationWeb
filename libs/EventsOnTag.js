/*var stepbutton= document.getElementById('stepButton');    
         stepbutton.onclick=function () {
             setup.controls.enabled=true;
             points=[];
             console.log(points);
             canvaswindows.on("mousedown",null);
             canvaswindows.on("mouseup",null);
             canvaswindows.on("mousemove",null);
             //canvaswindows.removeEventListener('click', onMouseClick);
             //window.addEventListener( 'mousemove', onMouseMove, false );
         };*/   
d3.select('#stepButton').on('click',function () {
    	    setup.controls.enabled=true;
            points=[];
            console.log(points);
            canvaswindows.on("mousedown",null);
            canvaswindows.on("mouseup",null);
            canvaswindows.on("mousemove",null);
            
});                  
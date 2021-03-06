//check if a vertex of index v in P is convex or concave
// obtuse if return 1
// convex if return -1
// in a line if return 0
function IsReflex(v,P) {
    var orient;
    var n=P.length;
    //console.log(n);
   if (v==0){
        orient=Orientation(P[n-1],P[v],P[v+1]);   
   }  	
   else if (v==n-1) {
    orient=Orientation(P[n-2],P[v],P[0]);
   }
   else {
    orient=Orientation(P[v-1],P[v],P[v+1]);
   }
   return orient; 	
}
 //Orientation operator for three 2d points
 //sig( |	1  1  1 |
 //		 | a0	b0 c0|
 //     | a1 b1 c1| )
function Orientation(a,b,c) {
        var det=b.x*c.y-a.x*c.y-b.y*c.x+a.y*c.x+a.x*b.y-a.y*b.x;
        if (det>0.0001) {
            return 1;
        }
        else if (det>0) {
             return 0;
       }
       else {
        return -1;
       }	
 }
//input three vecto3 big array
// Do the first sampling of the curve in the algorithm 
function Resample(input_points) {
    var n=input_points.length;
    var m=Math.floor((n-1)/5);
    //var sample=DouglasPeucker(input_points,0.01); 
    var sample=[points[0]]; 
    for(var i=1;i<m;i++){
        sample.push(points[i*5]);
    }
    sample.push[points[points.length-1]];
    updatePointSample(sample);
    drawSampleCurve();
}
function ForceClockWiseOrientation(){
    var x_min=pointSample[0].x;
    var imin=0;
    var n=pointSample.length;
    for (var i=1;i<pointSample.length;i++){
        if (pointSample[i].x<x_min){
            x_min=pointSample[i].x;
            imin=i;
        }
    }
    if(Orientation(pointSample[(imin-1+n)%n],pointSample[imin],pointSample[imin+1])!=-1){
        pointSample.reverse();
    }
}
function updatePointSample(newPointSample){
    var curve=new THREE.CatmullRomCurve3(newPointSample);
    curve.closed=true;
    var numberPoints=Math.round(curve.getLength()/(sizeGrid));
    pointSample=curve.getSpacedPoints(numberPoints);
    lengthPointSample=curve.getLength();
    pointSample.pop();
    //pointSample.pop();
     for(var i=0;i<pointSample.length;i++){
        pointSample[i].z=0.0;
    }
    ForceClockWiseOrientation();
}
function drawSampleCurve(){
    var geometrySample=new THREE.Geometry();
    geometrySample.vertices=pointSample.slice();
    geometrySample.vertices.push(pointSample[0]);
    if(LineSample!=undefined){
        setup.scene.remove(LineSample);
    }
    LineSample = new THREE.Line( geometrySample, materialSample );
    setup.scene.add( LineSample);
}
function updateSizeGrid(newVal){
 if(points.length!=0){
    sizeGrid=newVal;
    for( var i = setup.scene.children.length - 1; i >= 0; i--) { 
         var  obj = setup.scene.children[i];
         setup.scene.remove(obj);
    }
    pointSample = [ ];
    lengthPointSample=0;
    gridI=[];
    gridPointsArray=[]; 
    LineSample = new THREE.Object3D();
    gridgeometry = new THREE.Object3D();
    hemesh=new Hemesh();
    gridBoundary=[];
    gridInterior=[];
    GridMeshVertexArray=[];
    GridMeshFacesArray=[];
    TableHashIndextoPosition=[];
    TableHashVertextoFace=[];    
    document.getElementById("valueexample").innerHTML=newVal;
    Resample(points);
    createGrid(); 
    drawGrid(true);
    GrowingFeed();
    ptd=MappingVerteToStroke2();
    console.log(ptd); 
    drawAssociated();          
    drawBoundary(gridBoundary);
    cancelRender=false;
    render();
 }
}
function iv(i,j) { return i*height+i+j };
function drawBoundary(array){
         var Bgeometry= new THREE.Object3D();
         Bgeometry.name="LineBoundary";
         for(var i=0;i<array.length;i++){
            var edge=new THREE.Geometry();
            edge.vertices.push(gridPointsArray[array[i].index],gridPointsArray[array[i].next]);
            var line = new THREE.Line(edge,materialBoundaryGrid);
            Bgeometry.add(line);    
         }
         setup.scene.add(Bgeometry);
}
function createGrid(){
    var grid2d=setup.scene.getObjectByName("Grid2D");
    if(grid2d!=undefined){
        grid2d.children=[];
    }
    var x_min=pointSample[0].x;
    var x_max=pointSample[0].x;    
    var y_min=pointSample[0].y;
    var y_max=pointSample[0].y;
    for (var i=1;i<pointSample.length;i++){
        if (pointSample[i].x>x_max){
            x_max=pointSample[i].x;
        }
        if (pointSample[i].x<x_min){
            x_min=pointSample[i].x;
        }
        if (pointSample[i].y>y_max){
            y_max=pointSample[i].y;
        }
        if (pointSample[i].y<y_min){
            y_min=pointSample[i].y;
        }
    }
    var gridx=2*(x_max-x_min)/(sqrt3*sizeGrid);
    var gridy=(y_max-y_min)/sizeGrid;
    width=Math.floor(gridx)+1;
    height=Math.floor(gridy)+2;
    console.log(width);
    console.log(height);
    var geoedges =[];
    starx=x_min-(width*sqrt3*sizeGrid/2-(x_max-x_min))/2;
    stary=y_min-(height*sizeGrid-sizeGrid/2-(y_max-y_min))/2;
    for (var i = 0; i <= width; i++) {
            for (var j = 0; j <= height; j++) {            

                if(i%2==0){
                    geoedges.push(new THREE.Vector3(starx+i*sqrt3*sizeGrid/2,stary+j*sizeGrid,0.0));

                }
                else{
                    geoedges.push(new THREE.Vector3(starx+i*sqrt3*sizeGrid/2,stary+j*sizeGrid-sizeGrid/2,0.0));
                }

                if(i>0){
                    var geoedge=new THREE.Geometry();
                    geoedge.vertices.push(geoedges[iv(i-1,j)],geoedges[iv(i,j)]);
                    var line = new THREE.Line(geoedge,materialGrid2D);
                    gridgeometry.add(line);
                }        
                if(j>0){
                    var geoedge=new THREE.Geometry();
                    geoedge.vertices.push(geoedges[iv(i,j-1)],geoedges[iv(i,j)]);
                    var line = new THREE.Line(geoedge,materialGrid2D);
                    gridgeometry.add (line);
                }
                if(i>0 && j>0){
                    var geoedge=new THREE.Geometry();
                    if(i%2!=0){
                        geoedge.vertices.push(geoedges[iv(i-1,j-1)],geoedges[iv(i,j)]);
                    }
                    else{
                        geoedge.vertices.push(geoedges[iv(i-1,j+1)],geoedges[iv(i,j)]);
                    }
                    var line = new THREE.Line(geoedge,materialGrid2D);
                    gridgeometry.add (line);
                }
                gridI.push(i);
            }
    }
    gridPointsArray=geoedges;
}
function drawGrid(yes){
    if(yes){
        setup.scene.add(gridgeometry);
    }
    else{
        setup.scene.remove(gridgeometry);
    }
    if(mode!="fiber"){
        cancelRender=false;
        render();
        setTimeout(cancelAnimation,1000);    
    }
    
}

//Point-In-Polygon Algorithm: From http://alienryderflex.com/polygon/
function isInPolygon2(P,v){
var  i, j=P.length-1;
var  oddNodes=false;
for (i=0; i<P.length; i++) {
    if (( P[i].y< v.y && P[j].y>=v.y || P[j].y< v.y && P[i].y>=v.y) &&  (P[i].x<=v.x || P[j].x <=v.x)) {
        if (P[i].x+(v.y-P[i].y)/(P[j].y-P[i].y)*(P[j].x-P[i].x)<v.x){
           oddNodes=!oddNodes;    
        }
    }
    j=i; 
}
return oddNodes; 
}
function getBoundary2D(array){
var n=array.length;
var P=[];
for(var i=0;i<n;i++){
    P.push({x:array[i].x,y:array[i].y});
}
return P;
}
//create a class about vertex of the boundary
function  vertexBoundary(x,y,index,prev,next,indexa){
        this.x=x;
        this.y=y;
        //index on the grid of prev and next vertex
        this.index=index
        this.prev=prev;
        this.next=next;
        this.indexarray=indexa;
        this.associated=[];
}
function indexFromBoundary(P){
        var indexP=[];
        for(var i=0;i<P.length;i++){
            indexP[i]=P[i].index;
        }
        return indexP;
}
//get neiborhood of the vertex of index k;
function getNeiboorHoodIndex(k){
var result=[];
var i=gridI[k];
var j=k-(height+1)*i;
if(i%2==0){
     result[0]=iv(i,j-1);
     result[1]=iv(i-1,j);
     result[2]=iv(i-1,j+1);
     result[3]=iv(i,j+1);
     result[4]=iv(i+1,j+1);
     result[5]=iv(i+1,j);
}
else{
     result[0]=iv(i,j-1);
     result[1]=iv(i-1,j-1);
     result[2]=iv(i-1,j);
     result[3]=iv(i,j+1);
     result[4]=iv(i+1,j);
     result[5]=iv(i+1,j-1);
}
return result;
}
function getFeed(){
var P=getBoundary2D(pointSample);
//walk by the first line
var startx2D=starx;
var starty2D=parseFloat(stary)+parseFloat(sizeGrid);
//var pointGeometry = new THREE.Geometry();
//pointGeometry.vertices.push(new THREE.Vector3(startx2D,starty2D,0.0));

//var wireGeometry= new THREE.Object3D();
var materialBoundary = new THREE.LineBasicMaterial( { color: 0x27B327, linewidth: 2 } );         

// var pointmaterial = new THREE.PointsMaterial( {color: 0x27B327, size: 10.0, sizeAttenuation: false, alphaTest: 0.5 } );
//ointmaterial.color.setHSL( 1.0, 0.3, 0.7 );
var gotFeed=false;
var rows=1;
var boundaryFeed=[];
while(gotFeed==false && rows<(height-3)){
    for(var i=0;i<=width;i++){
        //console.log("estamos en i= ",i);
        var v={ x: gridPointsArray[iv(i,rows)].x, y : gridPointsArray[iv(i,rows)].y};
        //console.log("bool ", isInPolygon2(P,v)); 
        //pointGeometry.vertices=[new THREE.Vector3(v.x,v.y,0.0)];
        //var particles = new THREE.Points( pointGeometry, pointmaterial );
        //setup.scene.add( particles );
        if(isInPolygon2(P,v)){
            if(i%2==0){
              var v2={ x: gridPointsArray[iv(i-1,rows+1)].x, y:  gridPointsArray[iv(i-1,rows+1)].y};
              var v3={ x: gridPointsArray[iv(i-1,rows+2)].x, y: gridPointsArray[iv(i-1,rows+2)].y};
              var v4={ x: gridPointsArray[iv(i,rows+2)].x, y: gridPointsArray[iv(i,rows+2)].y};
              var v5={ x: gridPointsArray[iv(i+1,rows+2)].x, y: gridPointsArray[iv(i+1,rows+2)].y};
              var v6={ x: gridPointsArray[iv(i+1,rows+1)].x, y: gridPointsArray[iv(i+1,rows+1)].y};  

            }
            else{

             // continue;// for now fix a bug
              var v2={ x: gridPointsArray[iv(i-1,rows)].x, y:  gridPointsArray[iv(i-1,rows)].y};
              var v3={ x: gridPointsArray[iv(i-1,rows+1)].x, y: gridPointsArray[iv(i-1,rows+1)].y};
              var v4={ x: gridPointsArray[iv(i,rows+2)].x, y: gridPointsArray[iv(i,rows+2)].y};
              var v5={ x: gridPointsArray[iv(i+1,rows+1)].x, y: gridPointsArray[iv(i+1,rows+1)].y};
              var v6={ x: gridPointsArray[iv(i+1,rows)].x, y: gridPointsArray[iv(i+1,rows)].y};
            }

            if(isInPolygon2(P,v2)==true && isInPolygon2(P,v3)==true && isInPolygon2(P,v4)==true && isInPolygon2(P,v5)==true && isInPolygon2(P,v6)==true ){
                /*pointGeometry.vertices.push(new THREE.Vector3(v2.x,v2.y,0.0));
                pointGeometry.vertices.push(new THREE.Vector3(v3.x,v3.y,0.0));
                pointGeometry.vertices.push(new THREE.Vector3(v4.x,v4.y,0.0));
                pointGeometry.vertices.push(new THREE.Vector3(v5.x,v5.y,0.0));
                pointGeometry.vertices.push(new THREE.Vector3(v6.x,v6.y,0.0));
                var particle=new THREE.Points(pointGeometry, pointmaterial);
                setup.scene.add(particle);*/
                var neiborhoodIndex=[];
                if(i%2==0){
                    neiborhoodIndex[0]=iv(i,rows);
                    neiborhoodIndex[1]=iv(i-1,rows+1);
                    neiborhoodIndex[2]=iv(i-1,rows+2);
                    neiborhoodIndex[3]=iv(i,rows+2);
                    neiborhoodIndex[4]=iv(i+1,rows+2);
                    neiborhoodIndex[5]=iv(i+1,rows+1);
                }
                else{
                    neiborhoodIndex[0]=iv(i,rows);
                    neiborhoodIndex[1]=iv(i-1,rows);
                    neiborhoodIndex[2]=iv(i-1,rows+1);
                    neiborhoodIndex[3]=iv(i,rows+2);
                    neiborhoodIndex[4]=iv(i+1,rows+1);
                    neiborhoodIndex[5]=iv(i+1,rows);
                }
                boundaryFeed.push(new vertexBoundary(v.x,v.y,neiborhoodIndex[0],neiborhoodIndex[5],neiborhoodIndex[1],i)); 
                boundaryFeed.push(new vertexBoundary(v2.x,v2.y,neiborhoodIndex[1],neiborhoodIndex[0],neiborhoodIndex[2],i-1)); 
                boundaryFeed.push(new vertexBoundary(v3.x,v3.y,neiborhoodIndex[2],neiborhoodIndex[1],neiborhoodIndex[3],i-1)); 
                boundaryFeed.push(new vertexBoundary(v4.x,v4.y,neiborhoodIndex[3],neiborhoodIndex[2],neiborhoodIndex[4],i)); 
                boundaryFeed.push(new vertexBoundary(v5.x,v5.y,neiborhoodIndex[4],neiborhoodIndex[3],neiborhoodIndex[5],i+1)); 
                boundaryFeed.push(new vertexBoundary(v6.x,v6.y,neiborhoodIndex[5],neiborhoodIndex[4],neiborhoodIndex[0],i+1));   
                GridMeshVertexArray.push(new VertexGridmesh(v.x,v.y,0.0,"boundary",neiborhoodIndex[0]));
                GridMeshVertexArray.push(new VertexGridmesh(v2.x,v2.y,0.0,"boundary",neiborhoodIndex[1]));
                GridMeshVertexArray.push(new VertexGridmesh(v3.x,v3.y,0.0,"boundary",neiborhoodIndex[2]));
                GridMeshVertexArray.push(new VertexGridmesh(v4.x,v4.y,0.0,"boundary",neiborhoodIndex[3]));
                GridMeshVertexArray.push(new VertexGridmesh(v5.x,v5.y,0.0,"boundary",neiborhoodIndex[4]));
                GridMeshVertexArray.push(new VertexGridmesh(v6.x,v6.y,0.0,"boundary",neiborhoodIndex[5]));
                GridMeshVertexArray.push(new VertexGridmesh(gridPointsArray[neiborhoodIndex[0]+1].x,gridPointsArray[neiborhoodIndex[0]+1].y,0.0,"interior",(neiborhoodIndex[0]+1)));
                TableHashIndextoPosition[neiborhoodIndex[0].toString()]=0;
                TableHashIndextoPosition[neiborhoodIndex[1].toString()]=1;
                TableHashIndextoPosition[neiborhoodIndex[2].toString()]=2;
                TableHashIndextoPosition[neiborhoodIndex[3].toString()]=3;
                TableHashIndextoPosition[neiborhoodIndex[4].toString()]=4;
                TableHashIndextoPosition[neiborhoodIndex[5].toString()]=5;
                TableHashIndextoPosition[(neiborhoodIndex[0]+1).toString()]=6;
                GridMeshFacesArray.push([0,1,6],[1,2,6],[2,3,6],[3,4,6],[4,5,6],[5,0,6]);
                /*var edge1=new THREE.Geometry();
                var edge2=new THREE.Geometry();
                var edge3=new THREE.Geometry();
                var edge4=new THREE.Geometry();
                var edge5=new THREE.Geometry();
                var edge6=new THREE.Geometry();
                var edge0=new THREE.Geometry();

                edge0.vertices.push(gridPointsArray[rows+(height+1)*i],gridPointsArray[rows+(height+1)*i+1],gridPointsArray[rows+(height+1)*(i+1)+2],gridPointsArray[rows+(height+1)*(i+2)+2],gridPointsArray[rows+(height+1)*(i+2)+1],gridPointsArray[rows+(height+1)*(i+1)]);
                var line0 = new THREE.Line(edge0,materialBoundary);
                edge1.vertices.push(gridPointsArray[rows+(height+1)*i],gridPointsArray[rows+(height+1)*(i+1)+1]);
                edge2.vertices.push(gridPointsArray[rows+(height+1)*i+1],gridPointsArray[rows+(height+1)*(i+1)+1]);
                edge3.vertices.push(gridPointsArray[rows+(height+1)*(i+1)+2],gridPointsArray[rows+(height+1)*(i+1)+1]);
                edge4.vertices.push(gridPointsArray[rows+(height+1)*(i+2)+2],gridPointsArray[rows+(height+1)*(i+1)+1]);
                edge5.vertices.push(gridPointsArray[rows+(height+1)*(i+2)+1],gridPointsArray[rows+(height+1)*(i+1)+1]);
                edge6.vertices.push(gridPointsArray[rows+(height+1)*(i+1)],gridPointsArray[rows+(height+1)*(i+1)+1]);
                 var line1 = new THREE.Line(edge1,materialBoundary);
                 var line2 = new THREE.Line(edge2,materialBoundary);
                 var line3 = new THREE.Line(edge3,materialBoundary);
                 var line4 = new THREE.Line(edge4,materialBoundary);
                 var line5 = new THREE.Line(edge5,materialBoundary);
                 var line6 = new THREE.Line(edge6,materialBoundary);

                wireGeometry.add(line0);    
                wireGeometry.add(line1);   
                wireGeometry.add(line2);   
                wireGeometry.add(line3);   
                wireGeometry.add(line4);   
                wireGeometry.add(line5);   
                wireGeometry.add(line6);   
                setup.scene.add(wireGeometry);*/
                gotFeed=true;
                console.log("j = ",rows);  
                console.log("i = ",i);  
                break; 
            }
            else{
                continue;
            }

        }
    }
    rows++;
}
if(gotFeed==false){
    return [false,[]];   
}
else{
    //console.log(boundaryFeed);
    return [true,boundaryFeed];
}
}


function toDoubleLinkList(array){
var result=new DoublyLinkedList();
    for(var i=0;i<array.length;i++){
            var newvertex=new vertexBoundary(array[i].x,array[i].y,array[i].index,array[i].prev,array[i].next,0);
            result.add(newvertex);
    }
return result;        
}

function growVertex(varray,boundaryDoubleLinkList,v,addtoGrid){
      if(addtoGrid==undefined){addtoGrid=true;}
      //console.log(addtoGrid);
      var wireGeometry= new THREE.Object3D();
      var materialBoundary = new THREE.LineBasicMaterial( { color: 0x27B327, linewidth: 2 } );   
      if(addtoGrid){
          GridMeshVertexArray.push(new VertexGridmesh(gridPointsArray[v].x,gridPointsArray[v].y,0.0,"boundary",v));
          TableHashIndextoPosition[v.toString()]=GridMeshVertexArray.length-1;
      }
      switch(varray.length){
          case 2: //console.log(finalBoundary.toArray());
                  if(varray[1].next==varray[0].index){
                      boundaryDoubleLinkList.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[1].index,varray[0].index,GridMeshFacesArray.length),boundaryDoubleLinkList.positioni(varray[1]));   
                      varray[1].next=v;
                      varray[0].prev=v;
                      if(addtoGrid){           GridMeshFacesArray.push([TableHashIndextoPosition[varray[0].index.toString()],TableHashIndextoPosition[varray[1].index.toString()],GridMeshVertexArray.length-1]);
                      }
                  }
                  else{
                      boundaryDoubleLinkList.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[0].index,varray[1].index,GridMeshFacesArray.length),boundaryDoubleLinkList.positioni(varray[0]));   
                      varray[0].next=v;
                      varray[1].prev=v; 
                      if(addtoGrid){ GridMeshFacesArray.push([TableHashIndextoPosition[varray[1].index.toString()],TableHashIndextoPosition[varray[0].index.toString()],GridMeshVertexArray.length-1]);
                      }
                  }     
                  break;

          case 3: 
                  if(varray[1].next==varray[0].index){
                      boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[1]));
                      boundaryDoubleLinkList.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[2].index,varray[0].index,GridMeshFacesArray.length),boundaryDoubleLinkList.positioni(varray[2]));   
                      varray[2].next=v;
                      varray[0].prev=v; 
                      if(addtoGrid){ GridMeshFacesArray.push([TableHashIndextoPosition[varray[1].index.toString()],TableHashIndextoPosition[varray[2].index.toString()],GridMeshVertexArray.length-1]);
                      GridMeshFacesArray.push([TableHashIndextoPosition[varray[0].index.toString()],TableHashIndextoPosition[varray[1].index.toString()],GridMeshVertexArray.length-1]);
                      }
                  }
                  else{
                      boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[1]));
                      boundaryDoubleLinkList.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[0].index,varray[2].index,GridMeshFacesArray.length),boundaryDoubleLinkList.positioni(varray[0]));   
                      varray[0].next=v;
                      varray[2].prev=v;     
                      if(addtoGrid){ GridMeshFacesArray.push([TableHashIndextoPosition[varray[2].index.toString()],TableHashIndextoPosition[varray[1].index.toString()],GridMeshVertexArray.length-1]);
                      GridMeshFacesArray.push([TableHashIndextoPosition[varray[1].index.toString()],TableHashIndextoPosition[varray[0].index.toString()],GridMeshVertexArray.length-1]);
                      }
                  }

                  break;
          case 4: 
                  if(varray[1].next==varray[0].index){
                      boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[2]));
                      boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[1]));
                      boundaryDoubleLinkList.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[3].index,varray[0].index,GridMeshFacesArray.length),boundaryDoubleLinkList.positioni(varray[3]));   
                      varray[3].next=v;
                      varray[0].prev=v;
                      
                      if(addtoGrid){ GridMeshFacesArray.push([TableHashIndextoPosition[varray[2].index.toString()],TableHashIndextoPosition[varray[3].index.toString()],GridMeshVertexArray.length-1]);
                      GridMeshFacesArray.push([TableHashIndextoPosition[varray[1].index.toString()],TableHashIndextoPosition[varray[2].index.toString()],GridMeshVertexArray.length-1]);
                      GridMeshFacesArray.push([TableHashIndextoPosition[varray[0].index.toString()],TableHashIndextoPosition[varray[1].index.toString()],GridMeshVertexArray.length-1]);
                      }
                                    
                  }
                  else{
                      boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[2]));
                      boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[1]));
                      boundaryDoubleLinkList.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[0].index,varray[3].index,GridMeshFacesArray.length),boundaryDoubleLinkList.positioni(varray[0]));   
                      varray[0].next=v;
                      varray[3].prev=v;    
                      
                      if(addtoGrid){ GridMeshFacesArray.push([TableHashIndextoPosition[varray[3].index.toString()],TableHashIndextoPosition[varray[2].index.toString()],GridMeshVertexArray.length-1]);
                      GridMeshFacesArray.push([TableHashIndextoPosition[varray[2].index.toString()],TableHashIndextoPosition[varray[1].index.toString()],GridMeshVertexArray.length-1]);
                      GridMeshFacesArray.push([TableHashIndextoPosition[varray[1].index.toString()],TableHashIndextoPosition[varray[0].index.toString()],GridMeshVertexArray.length-1]);
                      }
                  }

                  break;

          case 5: 
                  if(varray[1].next==varray[0].index){
                      boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[3]));
                      boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[2]));
                      boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[1]));

                      boundaryDoubleLinkList.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[4].index,varray[0].index,GridMeshFacesArray.length),boundaryDoubleLinkList.positioni(varray[4]));   
                      varray[4].next=v;
                      varray[0].prev=v;        
                      
                      if(addtoGrid){ GridMeshFacesArray.push([TableHashIndextoPosition[varray[3].index.toString()],TableHashIndextoPosition[varray[4].index.toString()],GridMeshVertexArray.length-1]);
                      GridMeshFacesArray.push([TableHashIndextoPosition[varray[2].index.toString()],TableHashIndextoPosition[varray[3].index.toString()],GridMeshVertexArray.length-1]);
                      GridMeshFacesArray.push([TableHashIndextoPosition[varray[1].index.toString()],TableHashIndextoPosition[varray[2].index.toString()],GridMeshVertexArray.length-1]);
                      GridMeshFacesArray.push([TableHashIndextoPosition[varray[0].index.toString()],TableHashIndextoPosition[varray[1].index.toString()],GridMeshVertexArray.length-1]);
                      }
                  }
                  else{
                      boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[3]));
                      boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[2]));
                      boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[1]));
                      boundaryDoubleLinkList.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[0].index,varray[4].index,GridMeshFacesArray.length),boundaryDoubleLinkList.positioni(varray[0]));   
                      varray[0].next=v;
                      varray[4].prev=v;       
                      
                      if(addtoGrid){ GridMeshFacesArray.push([TableHashIndextoPosition[varray[4].index.toString()],TableHashIndextoPosition[varray[3].index.toString()],GridMeshVertexArray.length-1]);
                      GridMeshFacesArray.push([TableHashIndextoPosition[varray[3].index.toString()],TableHashIndextoPosition[varray[2].index.toString()],GridMeshVertexArray.length-1]);
                      GridMeshFacesArray.push([TableHashIndextoPosition[varray[2].index.toString()],TableHashIndextoPosition[varray[1].index.toString()],GridMeshVertexArray.length-1]);
                      GridMeshFacesArray.push([TableHashIndextoPosition[varray[1].index.toString()],TableHashIndextoPosition[varray[0].index.toString()],GridMeshVertexArray.length-1]);
                      }
                  }

                  break;                      

          case 6: if(varray[1].next==varray[0].index){
                      boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[4]));
                      boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[3]));
                      boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[2]));
                      boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[1]));
                      boundaryDoubleLinkList.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[5].index,varray[0].index,GridMeshFacesArray.length),boundaryDoubleLinkList.positioni(varray[5]));   
                      varray[5].next=v;
                      varray[0].prev=v;             
              
                      if(addtoGrid){ GridMeshFacesArray.push([TableHashIndextoPosition[varray[4].index.toString()],TableHashIndextoPosition[varray[5].index.toString()],GridMeshVertexArray.length-1]);
                      GridMeshFacesArray.push([TableHashIndextoPosition[varray[3].index.toString()],TableHashIndextoPosition[varray[4].index.toString()],GridMeshVertexArray.length-1]);
                      GridMeshFacesArray.push([TableHashIndextoPosition[varray[2].index.toString()],TableHashIndextoPosition[varray[3].index.toString()],GridMeshVertexArray.length-1]);
                      GridMeshFacesArray.push([TableHashIndextoPosition[varray[1].index.toString()],TableHashIndextoPosition[varray[2].index.toString()],GridMeshVertexArray.length-1]);
                      GridMeshFacesArray.push([TableHashIndextoPosition[varray[0].index.toString()],TableHashIndextoPosition[varray[1].index.toString()],GridMeshVertexArray.length-1]);
                      }
                  }
                  else{
                      boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[4]));
                      boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[3]));
                      boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[2]));
                      boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[1]));
                      boundaryDoubleLinkList.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[0].index,varray[5].index,GridMeshFacesArray.length),boundaryDoubleLinkList.positioni(varray[0]));   
                      varray[0].next=v;
                      varray[5].prev=v;
                     
                      if(addtoGrid){ GridMeshFacesArray.push([TableHashIndextoPosition[varray[5].index.toString()],TableHashIndextoPosition[varray[4].index.toString()],GridMeshVertexArray.length-1]);
                      GridMeshFacesArray.push([TableHashIndextoPosition[varray[4].index.toString()],TableHashIndextoPosition[varray[3].index.toString()],GridMeshVertexArray.length-1]);
                      GridMeshFacesArray.push([TableHashIndextoPosition[varray[3].index.toString()],TableHashIndextoPosition[varray[2].index.toString()],GridMeshVertexArray.length-1]);
                      GridMeshFacesArray.push([TableHashIndextoPosition[varray[2].index.toString()],TableHashIndextoPosition[varray[1].index.toString()],GridMeshVertexArray.length-1]);
                      GridMeshFacesArray.push([TableHashIndextoPosition[varray[1].index.toString()],TableHashIndextoPosition[varray[0].index.toString()],GridMeshVertexArray.length-1]);
                      }
                  }
                   break;
      }     

}
function GrowingFeed(){
var feed=getFeed();
if (feed[0]==false){
    console.log("nao tem semente");
}
else{ 
    //check if a vertex v is valid for the Boundary feedBound
    // i is the index of v in the gridPointsArray
    //return  index of the intersection of the vertex in  clockwise or  
    function validAdjacentVertex(feedBound,v,i){
        var P=getBoundary2D(pointSample);
        if(isInPolygon2(P,v)){

          var neiborhoodIndex=getNeiboorHoodIndex(i);


            //console.log(neiborhoodIndex);
            var vertexIntersection=[];
            var iP=indexFromBoundary(feedBound);
            var inicio=0;
            for(var j=0;j<6;j++){
                var indexP=iP.indexOf(neiborhoodIndex[j]);
                if(indexP==-1){
                    inicio=j;
                    break;
                }
            }
            //console.log("inicio ",inicio);
            for(var j=inicio;j<inicio+6;j++){
                //console.log("iter ", j%6);
                var indexP=iP.indexOf(neiborhoodIndex[j%6]);
                if(indexP!=-1){
                    vertexIntersection.push(feedBound[indexP]);
                }
            }
            if(vertexIntersection.length>1){
                //return indexFromBoundary(vertexIntersection);    
                return vertexIntersection;    
            }
            else{
                console.log("nao cheguei");
                return vertexIntersection;
            }

        }
        else{
            console.log("nao cheguei");
            return vertexIntersection;
        }
    }

    //Get the exterior grid vertex to the polygon bound
    // give an array of index in gridpointArray
    function getOutVertexFromBoundary(P,bound){
        var result=[];
        for(var j=0;j<bound.length;j++){
            var i=bound[j].index;
            var ibound=indexFromBoundary(bound);
            var neiborhoodIndex=getNeiboorHoodIndex(i);
            //var neiborhoodIndex=[i-2-height,i-1-height,i+1,i+height+2,i+height+1,i-1];
            for(var k=0;k<6;k++){
               if(!isInPolygon2(bound,gridPointsArray[neiborhoodIndex[k]]) && isInPolygon2(P,gridPointsArray[neiborhoodIndex[k]]) && ibound.indexOf(neiborhoodIndex[k])==-1){
                   result.push(neiborhoodIndex[k]);
                }    
            }
        }
        return result.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});
    }


    //Start growing algorithm
    var P=getBoundary2D(pointSample);
    var stackBoundayToProcess=getOutVertexFromBoundary(P,feed[1]);
    //console.log(stackBoundayToProcess);
    var finalBoundary=toDoubleLinkList(feed[1]);
    while(stackBoundayToProcess.length!=0){
      var v=stackBoundayToProcess.shift();
      //console.log(v);    
      var varray=validAdjacentVertex(finalBoundary.toArray(),gridPointsArray[v],v);

      if(varray.length<2){continue;}    
      growVertex(varray,finalBoundary,v);       
      if(stackBoundayToProcess.length==0){
          //console.log(indexFromBoundary(finalBoundary.toArray()));
          //t++;
          stackBoundayToProcess=getOutVertexFromBoundary(P,finalBoundary.toArray());
          //console.log(stackBoundayToProcess);    
         // if(stackBoundayToProcess.length==0){break;}
      } 

    }
    gridBoundary=finalBoundary.toArray();
    /*var VertexInteriores=toThreeVector3(GridMeshVertexArray); 
    var FacesVertices=createMesh(GridMeshFacesArray,offsetZ(VertexInteriores,parseFloat(sizeGrid)),offsetZ(VertexInteriores,-sizeGrid)); 
    hemesh.fromFaceVertexArray(FacesVertices[0],FacesVertices[1]);*/
    
}

}
function MappingVerteToStroke2(){
     //Compute the curvature of the vertex like the Discrete Gradient of Arc Length. For example in
    // http://www.cs.utexas.edu/users/evouga/uploads/4/5/6/8/45689883/notes1.pdf
    //lvertex,vertex and rvertex are three vertex consecutives
    function CurvatureVertex(lvertex,vertex,rvertex){
        var vl=new THREE.Vector2(lvertex.x,lvertex.y);
        var vc=new THREE.Vector2(vertex.x,vertex.y);
        var vr=new THREE.Vector2(rvertex.x,rvertex.y);
        var v1=vc.clone().sub(vl);
        var v2=vr.clone().sub(vc);
        var mod1=v1.length();
        var mod2=v2.length();
        var angle= Math.acos(v1.dot(v2)/(mod1*mod2));
        //console.log(Math.sin(angle));
        return (4*Math.sin(angle/2)/(mod1+mod2));
    }
    //return the index of the nearest grid point to vertex
    // return undefined if no nearest grid point is found
    //based by find the grid triangle that contem the vertex

    function findNearGridVertex(vertex,arrayBoundaryIndex){
        var i=Math.floor(2*(vertex.x-starx)/(sqrt3*sizeGrid)); 
        if(i%2==0){
            var j=Math.floor((vertex.y-stary)/sizeGrid);
        }
        else{
            var j=Math.floor((vertex.y-stary+sizeGrid/2)/sizeGrid);

        }
        var m1=1.0/sqrt3;
        var m2=-m1;
        var n1=gridPointsArray[iv(i,j)].y-m1*gridPointsArray[iv(i,j)].x;
        var n2=gridPointsArray[iv(i,j+1)].y-m2*gridPointsArray[iv(i,j+1)].x;
        var eval1=m1*vertex.x+n1;
        var eval2=m2*vertex.x+n2;
        var neiborhoodIndex=[];
        var pointGeometry = new THREE.Geometry();
        var pointGeometryb = new THREE.Geometry();
        var pointmaterial = new THREE.PointsMaterial( {color: 0x27B327, size: 5.0, sizeAttenuation: false, alphaTest: 0.5 } );
        var pointmaterialblack = new THREE.PointsMaterial( {color: 0x000000, size: 5.0, sizeAttenuation: false, alphaTest: 0.5 } );

        if (eval2<vertex.y){
                if(i%2==0){
                  neiborhoodIndex=[iv(i,j+1),iv(i+1,j+2),iv(i+1,j+1)];
                }
                else{
                  neiborhoodIndex=[iv(i,j+1),iv(i+1,j+1),iv(i+1,j)];  
                }
        }    
        else if(eval1<vertex.y){
                if(i%2==0){
                  neiborhoodIndex=[iv(i,j),iv(i,j+1),iv(i+1,j+1)];
                }
                else{
                  neiborhoodIndex=[iv(i,j),iv(i,j+1),iv(i+1,j)];     
                }
        }
        else{
                if(i%2==0){
                  neiborhoodIndex=[iv(i,j),iv(i+1,j+1),iv(i+1,j)];
                }
                else{
                  neiborhoodIndex=[iv(i,j),iv(i+1,j),iv(i+1,j-1)];    
                }   
        }
        
        var point=new THREE.Vector2(vertex.x,vertex.y);
        var v0=new THREE.Vector2(gridPointsArray[neiborhoodIndex[0]].x,gridPointsArray[neiborhoodIndex[0]].y);
        var v1=new THREE.Vector2(gridPointsArray[neiborhoodIndex[1]].x,gridPointsArray[neiborhoodIndex[1]].y);
        var v2=new THREE.Vector2(gridPointsArray[neiborhoodIndex[2]].x,gridPointsArray[neiborhoodIndex[2]].y);
        var neiborhood=[v0,v1,v2];

       // console.log(neiborhoodIndex);
        var min=point.distanceTo(v0);
        var imin=neiborhoodIndex[0];
        var t=0;
        for(var k=1;k<3;k++){
            var indexB=arrayBoundaryIndex.indexOf(neiborhoodIndex[k]);
            if(indexB!=-1){
                var d=point.distanceTo(neiborhood[k]);
                if(d<min || t==0 ){
                    min=d;    
                    //imin=neiborhoodIndex[k];
                    imin=indexB;
                }
                t++;
            }
        }
        var index0=arrayBoundaryIndex.indexOf(neiborhoodIndex[0]);
        if(t!=0){return imin;}
        else if(index0!=-1){
            return index0;// second is the index in the boundary correspond to first 
        }
        else{
            if(mode!="fiber"){
                pointGeometry.vertices.push(gridPointsArray[neiborhoodIndex[0]],gridPointsArray[neiborhoodIndex[1]],gridPointsArray[neiborhoodIndex[2]],gridPointsArray[neiborhoodIndex[2]]);
                pointGeometryb.vertices.push(new THREE.Vector3(vertex.x,vertex.y,vertex.z));
                var particles=new THREE.Points(pointGeometry,pointmaterial);
                var particlesb=new THREE.Points(pointGeometryb,pointmaterialblack);    
                setup.scene.add(particles);
                setup.scene.add(particlesb);
            }
            console.log("muito espaco");
        }

    }
   
    var n=pointSample.length;
    
    console.log("sample ", n);
    //console.log("sample0 ", pointSample[0]);
    //console.log("samplen-1 ", pointSample[n-1]);
    
    var curvatures=[[0,CurvatureVertex(pointSample[n-1],pointSample[0],pointSample[1])],[n-1,CurvatureVertex(pointSample[n-2],pointSample[n-1],pointSample[0])]];
    for(var i=1;i<n-1;i++){
        curvatures.push([i,CurvatureVertex(pointSample[i-1],pointSample[i],pointSample[i+1])]);
    }
    curvatures.sort(function(a, b){return b[1]-a[1]});
    console.log(curvatures.length,n);
    var m=gridBoundary.length;
    console.log("gridpoint ", m);
    var PointsToDelete=[];
    for(var j=0;j<m;j++){
       gridBoundary[j].associated=[];   
    }
    for(var j=0;j<n;j++){
        var fi=findNearGridVertex(pointSample[curvatures[j][0]],indexFromBoundary(gridBoundary));
        if(fi!=undefined){
            if(gridBoundary[fi].associated.length!=0){
                if(curvatures[j][0]==0){
                        if(gridBoundary[fi].associated[gridBoundary[fi].associated.length-1]==1){
                            gridBoundary[fi].associated[gridBoundary[fi].associated.length-1]=0;
                            gridBoundary[fi].associated.push(1);
                        }
                        else{
                            gridBoundary[fi].associated.push(curvatures[j][0]);
                        }
                }
                else if(curvatures[j][0]==n-1){
                     if(gridBoundary[fi].associated[0]==0){
                            gridBoundary[fi].associated.unshift(curvatures[j][0]);
                     }
                     else{
                            gridBoundary[fi].associated.push(curvatures[j][0]);
                     }
                }
                else{
                    gridBoundary[fi].associated.push(curvatures[j][0]);        
                }
            }
            else{
                    gridBoundary[fi].associated.push(curvatures[j][0]);        
            }
        }
        else{
            PointsToDelete.push(curvatures[j][0]);
            continue;
        }
    }
    if (PointsToDelete.length==0){
        for(var i=0;i<m;i++){
            if(gridBoundary[i].associated.length==0){
                var a=gridBoundary[(i-1+m)%m].associated;
                var b=gridBoundary[(i+1)%m].associated;
                var v0=new THREE.Vector2(gridPointsArray[gridBoundary[i].index].x,gridPointsArray[gridBoundary[i].index].y);
                var da=1000000;
                var db=1000000;
                var imin=-1;
                for(var j=0;j<a.length;j++){
                     var v1=new THREE.Vector2(pointSample[a[j]].x,pointSample[a[j]].y);
                     var dist=v1.distanceTo(v0);
                     if(dist<da){
                         da=dist;
                         imin=a[j];
                     }
                }
                //gridBoundary[i].associated.push(imin);
                db=da;
                for(var j=0;j<b.length;j++){
                     var v1=new THREE.Vector2(pointSample[b[j]].x,pointSample[b[j]].y);
                     var dist=v1.distanceTo(v0);
                     if(dist<db){
                         db=dist;
                         imin=b[j];
                     }
                }
                gridBoundary[i].associated.push(imin);
                //console.log(gridBoundary[i].associated);
            }
        }
    }
    return PointsToDelete;
}
function MappingVerteToStroke(){

    //Compute the curvature of the vertex like the Discrete Gradient of Arc Length. For example in
    // http://www.cs.utexas.edu/users/evouga/uploads/4/5/6/8/45689883/notes1.pdf
    //lvertex,vertex and rvertex are three vertex consecutives
    function CurvatureVertex(lvertex,vertex,rvertex){
        var vl=new THREE.Vector2(lvertex.x,lvertex.y);
        var vc=new THREE.Vector2(vertex.x,vertex.y);
        var vr=new THREE.Vector2(rvertex.x,rvertex.y);
        var v1=vc.clone().sub(vl);
        var v2=vr.clone().sub(vc);
        var mod1=v1.length();
        var mod2=v2.length();
        var angle= Math.acos(v1.dot(v2)/(mod1*mod2));
        //console.log(Math.sin(angle));
        return (4*Math.sin(angle/2)/(mod1+mod2));
    }
    //return the index of the nearest grid point to vertex
    // return undefined if no nearest grid point is found
    //based by find the grid triangle that contem the vertex

    function findNearGridVertex(vertex,arrayBoundaryIndex){
        var i=Math.floor(2*(vertex.x-starx)/(sqrt3*sizeGrid)); 
        if(i%2==0){
            var j=Math.floor((vertex.y-stary)/sizeGrid);
        }
        else{
            var j=Math.floor((vertex.y-stary+sizeGrid/2)/sizeGrid);

        }
        var m1=1.0/sqrt3;
        var m2=-m1;
        var n1=gridPointsArray[iv(i,j)].y-m1*gridPointsArray[iv(i,j)].x;
        var n2=gridPointsArray[iv(i,j+1)].y-m2*gridPointsArray[iv(i,j+1)].x;
        var eval1=m1*vertex.x+n1;
        var eval2=m2*vertex.x+n2;
        var neiborhoodIndex=[];
        var pointGeometry = new THREE.Geometry();
        var pointGeometryb = new THREE.Geometry();
        var pointmaterial = new THREE.PointsMaterial( {color: 0x27B327, size: 5.0, sizeAttenuation: false, alphaTest: 0.5 } );
        var pointmaterialblack = new THREE.PointsMaterial( {color: 0x000000, size: 5.0, sizeAttenuation: false, alphaTest: 0.5 } );

        if (eval2<vertex.y){
                if(i%2==0){
                  neiborhoodIndex=[iv(i,j+1),iv(i+1,j+2),iv(i+1,j+1)];
                }
                else{
                  neiborhoodIndex=[iv(i,j+1),iv(i+1,j+1),iv(i+1,j)];  
                }
        }    
        else if(eval1<vertex.y){
                if(i%2==0){
                  neiborhoodIndex=[iv(i,j),iv(i,j+1),iv(i+1,j+1)];
                }
                else{
                  neiborhoodIndex=[iv(i,j),iv(i,j+1),iv(i+1,j)];     
                }
        }
        else{
                if(i%2==0){
                  neiborhoodIndex=[iv(i,j),iv(i+1,j+1),iv(i+1,j)];
                }
                else{
                  neiborhoodIndex=[iv(i,j),iv(i+1,j),iv(i+1,j-1)];    
                }   
        }
        
        var point=new THREE.Vector2(vertex.x,vertex.y);
        var v0=new THREE.Vector2(gridPointsArray[neiborhoodIndex[0]].x,gridPointsArray[neiborhoodIndex[0]].y);
        var v1=new THREE.Vector2(gridPointsArray[neiborhoodIndex[1]].x,gridPointsArray[neiborhoodIndex[1]].y);
        var v2=new THREE.Vector2(gridPointsArray[neiborhoodIndex[2]].x,gridPointsArray[neiborhoodIndex[2]].y);
        var neiborhood=[v0,v1,v2];

       // console.log(neiborhoodIndex);
        var min=point.distanceTo(v0);
        var imin=neiborhoodIndex[0];
        var t=0;
        for(var k=1;k<3;k++){
            var indexB=arrayBoundaryIndex.indexOf(neiborhoodIndex[k]);
            if(indexB!=-1){
                var d=point.distanceTo(neiborhood[k]);
                if(d<min || t==0 ){
                    min=d;    
                    //imin=neiborhoodIndex[k];
                    imin=indexB;
                }
                t++;
            }
        }
        var index0=arrayBoundaryIndex.indexOf(neiborhoodIndex[0]);
        if(t!=0){return imin;}
        else if(index0!=-1){
            return index0;// second is the index in the boundary correspond to first 
        }
        else{
            if(mode!="fiber"){
                pointGeometry.vertices.push(gridPointsArray[neiborhoodIndex[0]],gridPointsArray[neiborhoodIndex[1]],gridPointsArray[neiborhoodIndex[2]],gridPointsArray[neiborhoodIndex[2]]);
                pointGeometryb.vertices.push(new THREE.Vector3(vertex.x,vertex.y,vertex.z));
                var particles=new THREE.Points(pointGeometry,pointmaterial);
                var particlesb=new THREE.Points(pointGeometryb,pointmaterialblack);    
                setup.scene.add(particles);
                setup.scene.add(particlesb);
            }
            console.log("muito espaco");
        }

    }

    var n=pointSample.length;
    
    console.log("sample ", n);
    //console.log("sample0 ", pointSample[0]);
    //console.log("samplen-1 ", pointSample[n-1]);
    var curvatures=[[0,CurvatureVertex(pointSample[n-1],pointSample[0],pointSample[1])],[n-1,CurvatureVertex(pointSample[n-2],pointSample[n-1],pointSample[0])]];
    for(var i=1;i<n-1;i++){
        curvatures.push([i,CurvatureVertex(pointSample[i-1],pointSample[i],pointSample[i+1])]);
    }
    curvatures.sort(function(a, b){return b[1]-a[1]});
    console.log(curvatures.length,n);
    var m=gridBoundary.length;
    console.log("gridpoint ", m);
    var PointsToDelete=[];
    for(var j=0;j<n;j++){
        var fi=findNearGridVertex(pointSample[curvatures[j][0]],indexFromBoundary(gridBoundary));
        if(fi!=undefined){
            gridBoundary[fi].associated.push(curvatures[j][0]);
        }
        else{
            PointsToDelete.push(curvatures[j][0]);
            continue;
        }
    }
    if (PointsToDelete.length==0){
        for(var i=0;i<m;i++){
            if(gridBoundary[i].associated.length==0){
                var a=gridBoundary[(i-1+m)%m].associated;
                var b=gridBoundary[(i+1)%m].associated;
                var v0=new THREE.Vector2(gridPointsArray[gridBoundary[i].index].x,gridPointsArray[gridBoundary[i].index].y);
                var d=1000000;
                var imin=-1;
                for(var j=0;j<a.length;j++){
                     var v1=new THREE.Vector2(pointSample[a[j]].x,pointSample[a[j]].y);
                     var dist=v1.distanceTo(v0);
                     if(dist<d){
                         d=dist;
                         imin=a[j];
                     }
                }
                gridBoundary[i].associated.push(imin);
                var d=1000000;
                for(var j=0;j<b.length;j++){
                     var v1=new THREE.Vector2(pointSample[b[j]].x,pointSample[b[j]].y);
                     var dist=v1.distanceTo(v0);
                     if(dist<d){
                         d=dist;
                         imin=b[j];
                     }
                }
                if(imin!=gridBoundary[i].associated[0]){
                    gridBoundary[i].associated.push(imin);    
                }
                
                //console.log(gridBoundary[i].associated);
            }
            
        }

    }
    return PointsToDelete;
}
function endAssociated(){
     var n=gridBoundary.length;
     for(var i=0;i<n;i++){
        var a=gridBoundary[i].associated;
        var c=gridBoundary[(i+1)%n].associated[gridBoundary[(i+1)%n].associated.length-1]; 
        var d=gridBoundary[(i+1)%n].associated[0];  
        if(a.indexOf(c)==-1 && a.indexOf(d)==-1) {
            var v0=new THREE.Vector2(gridPointsArray[gridBoundary[i].index].x,gridPointsArray[gridBoundary[i].index].y);
            var v1=new THREE.Vector2(pointSample[c].x,pointSample[c].y);
            var v2=new THREE.Vector2(pointSample[d].x,pointSample[d].y);
            var d1=v1.distanceTo(v0);
            var d2=v2.distanceTo(v0);
            var b=(d1>d2)?d:c;
            if(Orientation(gridPointsArray[gridBoundary[i].index],pointSample[b],gridPointsArray[gridBoundary[(i+1)%n].index])==-1){
                gridBoundary[i].associated.push(b);
                GridMeshVertexArray.push(new VertexGridmesh(pointSample[b].x,pointSample[b].y,0.0,"boundaryPS",b));
                TableHashIndextoPosition["p"+b.toString()]=GridMeshVertexArray.length-1;
            }
            else{
                var e=gridBoundary[(i+1)%n].associated;
                var f=gridBoundary[i].associated[gridBoundary[i].associated.length-1]; 
                var g=gridBoundary[i].associated[0];  
                if(e.indexOf(f)==-1 && e.indexOf(g)==-1) {
                    var v0=new THREE.Vector2(gridPointsArray[gridBoundary[(i+1)%n].index].x,gridPointsArray[gridBoundary[(i+1)%n].index].y);
                    var v1=new THREE.Vector2(pointSample[f].x,pointSample[f].y);
                    var v2=new THREE.Vector2(pointSample[g].x,pointSample[g].y);
                    var dh1=v1.distanceTo(v0);
                    var dh2=v2.distanceTo(v0);
                    var bo=(dh1>dh2)?g:f;
                    gridBoundary[(i+1)%n].associated.unshift(bo);
                    GridMeshVertexArray.push(new VertexGridmesh(pointSample[bo].x,pointSample[bo].y,0.0,"boundaryPS",bo));
                    TableHashIndextoPosition["p"+bo.toString()]=GridMeshVertexArray.length-1;
                    //console.log("algo");
                }
            }
            if(gridBoundary[i].next== gridBoundary[(i+1)%n].index){
                   GridMeshFacesArray.push([TableHashIndextoPosition[gridBoundary[(i+1)%n].index.toString()],TableHashIndextoPosition[gridBoundary[i].index.toString()],GridMeshVertexArray.length-1]);    
            }
            else{
               GridMeshFacesArray.push([TableHashIndextoPosition[gridBoundary[i].index.toString()],TableHashIndextoPosition[gridBoundary[(i+1)%n].index.toString()],GridMeshVertexArray.length-1]);    
            }
        }
     }    
}
function endAssociated2(){
    var n=gridBoundary.length;
    var r=pointSample.length;
         function searchAssociated(index,pj){
            var result=[];
            var t=0;
            for(var i=index;i<index+n;i++){
                if(gridBoundary[i%n].associated.indexOf(pj)!=-1){
                    result.push(i%n);
                    t++;
                }
                else if(t>0){
                    break;
                }
            }
            return result;
         }
   
    //var material = new THREE.LineBasicMaterial( { color: 0xAEB404, linewidth: 2 } );
    //var Bgeometry= new THREE.Object3D();
    for(var i=0;i<n;i++){
        if(gridBoundary[i].associated.indexOf(0)==-1){
            var lg=gridBoundary[i].associated.length;
            if(gridBoundary[i].associated[0]>gridBoundary[i].associated[lg-1]){
                gridBoundary[i].associated.reverse();
            }
        }
    }
     for(var i=0;i<n;i++){
        
        var c=gridBoundary[i].associated[gridBoundary[i].associated.length-1]; 
        var d=gridBoundary[(i+1)%n].associated[0];  
        
        /*console.log("iboundary ",i); 
        console.log("i ",gridI[gridBoundary[i].index]);  
        console.log("j ",gridBoundary[i].index-(height+1)*gridI[gridBoundary[i].index]);
        console.log("boundary i+1",gridBoundary[(i+1)%n].associated); */
        if(c<d || (d==0 && c!=0)) {
            var v0=new THREE.Vector2(gridPointsArray[gridBoundary[i].index].x,gridPointsArray[gridBoundary[i].index].y);
            var v00=new THREE.Vector2(gridPointsArray[gridBoundary[(i+1)%n].index].x,gridPointsArray[gridBoundary[(i+1)%n].index].y);
            var v1=new THREE.Vector2(pointSample[c].x,pointSample[c].y);
            var v2=new THREE.Vector2(pointSample[d].x,pointSample[d].y);
            var d1=v1.distanceTo(v00);
            var d2=v2.distanceTo(v0);
            var b=(d1>d2)?d:c;
            
            //var edge=new THREE.Geometry(); 
            
            if(d1>d2){
              gridBoundary[i].associated.push(d);
              //gridBoundary[i].associated=gridBoundary[i].associated.sort();
              //edge.vertices.push(gridPointsArray[gridBoundary[i].index],pointSample[d]);    
              //console.log("iadd",i);    
              //console.log(gridBoundary[i].associated);    
            }
            else{
              gridBoundary[(i+1)%n].associated.unshift(c);
              //edge.vertices.push(gridPointsArray[gridBoundary[(i+1)%n].index],pointSample[c]);
              //console.log("i+1 add",(i+1)%n);
              //console.log(gridBoundary[(i+1)%n].associated);        
            }
            //var line = new THREE.Line(edge,material);
            //Bgeometry.add(line);  
        } 
        /*else{
            console.log([c,d]);
            console.log("iboundary ",i); 
            console.log("i ",gridI[gridBoundary[i].index]);  
            console.log("j ",gridBoundary[i].index-(height+1)*gridI[gridBoundary[i].index]);
            
        }*/
         
    }
    //setup.scene.add(Bgeometry);
    var associatedSample=[];
    var i0=0;
    for(var i=0;i<n;i++){
        if(gridBoundary[i].associated.indexOf(0)==-1){
            i0=i;
            break;
        }
    }
    for(var j=0;j<r;j++){
        var aux=searchAssociated(i0,j);
        associatedSample.push(aux);
        i0=aux[aux.length-1];
        GridMeshVertexArray.push(new VertexGridmesh(pointSample[j].x,pointSample[j].y,0.0,"boundaryPS",j));
        TableHashIndextoPosition["p"+j.toString()]=GridMeshVertexArray.length-1;
    }         
    for(var j=0;j<r;j++){
        if(associatedSample[j].length>1){
            for(k=0;k<associatedSample[j].length-1;k++){
                GridMeshFacesArray.push([TableHashIndextoPosition["p"+j.toString()],TableHashIndextoPosition[gridBoundary[associatedSample[j][k+1]].index.toString()],TableHashIndextoPosition[gridBoundary[associatedSample[j][k]].index.toString()]]);    
            }
        }
    }
    for(var j=0;j<n;j++){
        if(gridBoundary[j].associated.length>1){
            for(k=0;k<gridBoundary[j].associated.length-1;k++){
                GridMeshFacesArray.push([TableHashIndextoPosition["p"+gridBoundary[j].associated[k].toString()],TableHashIndextoPosition["p"+gridBoundary[j].associated[k+1].toString()],TableHashIndextoPosition[gridBoundary[j].index.toString()]]);    
            }
        }
    }
    
}
function printGridBoundary(){
    for(var i=0;i<gridBoundary.length;i++){
        console.log(gridBoundary[i].associated);
        console.log(i);
    }
}
function printPointG(v){
     var partt=setup.scene.getObjectByName("auxpointG");
     if(partt!= undefined){
        setup.scene.remove(partt);
        partt={};    
     }
     var pointG=new THREE.Geometry();
     pointG.vertices.push(new THREE.Vector3(v.x,v.y,v.z));
     var pointM=new THREE.PointsMaterial( {color: 0xE62ECD, size: 10.0, sizeAttenuation: false, alphaTest: 0.5 } );
     var partt=new THREE.Points(pointG, pointM);
     partt.name="auxpointG";
     setup.scene.add(partt);
}
function endAssociated3(){
    var n=gridBoundary.length;
    var r=pointSample.length;
     function searchAssociated(index,pj){
        var result=[];
        var t=0;
        for(var i=index;i<index+n;i++){
            if(gridBoundary[i%n].associated.indexOf(pj)!=-1){
                result.push(i%n);
                t++;
            }
            else if(t>0){
                break;
            }
        }
        return result;
     }
    var associatedSample=[];
    var i0=0;
    for(var i=0;i<n;i++){
        if(gridBoundary[i].associated.indexOf(0)==-1){
            i0=i;
            break;
        }
    }
    for(var j=0;j<r;j++){
        var aux=searchAssociated(i0,j);
        associatedSample.push(aux);
        i0=aux[aux.length-1];
        GridMeshVertexArray.push(new VertexGridmesh(pointSample[j].x,pointSample[j].y,0.0,"boundaryPS",j));
        TableHashIndextoPosition["p"+j.toString()]=GridMeshVertexArray.length-1;
    }         
    for(var j=0;j<r;j++){
        if(associatedSample[j].length>1){
            for(k=0;k<associatedSample[j].length-1;k++){
                GridMeshFacesArray.push([TableHashIndextoPosition["p"+j.toString()],TableHashIndextoPosition[gridBoundary[associatedSample[j][k+1]].index.toString()],TableHashIndextoPosition[gridBoundary[associatedSample[j][k]].index.toString()]]);    
            }
        }
        else{
            var assoGrid=gridBoundary[associatedSample[j][0]].associated;
            if(assoGrid.length==1){
                var v0=new THREE.Vector2(gridPointsArray[gridBoundary[associatedSample[j][0]].index].x,gridPointsArray[gridBoundary[associatedSample[j][0]].index].y);
                var v00=new THREE.Vector2(gridPointsArray[gridBoundary[associatedSample[(j+1)%r][0]].index].x,gridPointsArray[gridBoundary[associatedSample[(j+1)%r][0]].index].y);
                var v1=new THREE.Vector2(pointSample[j].x,pointSample[j].y);
                var v2=new THREE.Vector2(pointSample[(j+1)%r].x,pointSample[(j+1)%r].y);
                var d1=v1.distanceTo(v00);
                var d2=v2.distanceTo(v0);
                var next=(j+1)%r;
                if(d1>d2){
                   if(gridBoundary[associatedSample[j][0]].next=gridBoundary[associatedSample[next][0]].index){    
                        GridMeshFacesArray.push([TableHashIndextoPosition[gridBoundary[associatedSample[next][0]].index.toString()],TableHashIndextoPosition[gridBoundary[associatedSample[j][0]].index.toString()],TableHashIndextoPosition["p"+next.toString()]]);
                        GridMeshFacesArray.push([TableHashIndextoPosition["p"+j.toString()],TableHashIndextoPosition["p"+next.toString()],TableHashIndextoPosition[gridBoundary[associatedSample[j][0]].index.toString()]]);
                       
                   }
                   else{
                       GridMeshFacesArray.push([TableHashIndextoPosition[gridBoundary[associatedSample[j][0]].index.toString()],TableHashIndextoPosition[gridBoundary[associatedSample[next][0]].index.toString()],TableHashIndextoPosition["p"+next.toString()]]);   
                       GridMeshFacesArray.push([TableHashIndextoPosition["p"+next.toString()],TableHashIndextoPosition["p"+j.toString()],TableHashIndextoPosition[gridBoundary[associatedSample[j][0]].index.toString()]]);
                   }    
                }
                else{
                    if(gridBoundary[associatedSample[j][0]].next=gridBoundary[associatedSample[next][0]].index){        
                        GridMeshFacesArray.push([TableHashIndextoPosition[gridBoundary[associatedSample[next][0]].index.toString()],TableHashIndextoPosition[gridBoundary[associatedSample[j][0]].index.toString()],TableHashIndextoPosition["p"+j.toString()]]);        
                        GridMeshFacesArray.push([TableHashIndextoPosition["p"+j.toString()],TableHashIndextoPosition["p"+next.toString()],TableHashIndextoPosition[gridBoundary[associatedSample[next][0]].index.toString()]]);
                    }
                    else{
                        GridMeshFacesArray.push([TableHashIndextoPosition[gridBoundary[associatedSample[J][0]].index.toString()],TableHashIndextoPosition[gridBoundary[associatedSample[next][0]].index.toString()],TableHashIndextoPosition["p"+j.toString()]]);  
                        
                        GridMeshFacesArray.push([TableHashIndextoPosition["p"+next.toString()],TableHashIndextoPosition["p"+f.toString()],TableHashIndextoPosition[gridBoundary[associatedSample[next][0]].index.toString()]]);
                    }
                }
   
            }
            else if(j==assoGrid[0]){
                console.log("j ", j);
                for(k=0;k<assoGrid.length-1;k++){
                    if(gridBoundary[associatedSample[j][0]].index=gridBoundary[associatedSample[(j+1)%r][0]].next){        
                        GridMeshFacesArray.push([TableHashIndextoPosition[gridBoundary[associatedSample[j][0]].index.toString()],TableHashIndextoPosition["p"+assoGrid[k].toString()],TableHashIndextoPosition["p"+assoGrid[k+1].toString()]]);  
                        
                    }
                    else{
                        GridMeshFacesArray.push([TableHashIndextoPosition["p"+assoGrid[k].toString()],TableHashIndextoPosition[gridBoundary[associatedSample[j][0]].index.toString()],TableHashIndextoPosition["p"+assoGrid[k+1].toString()]]);    
                    }
                    console.log(assoGrid);
                    console.log("k ", k);
                }
            }
            else{
                
            }
            
        }
    }
    
}
function drawAssociated(){
 if(ptd.length==0){    
     var materialBoundary = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 2 } );
     var materialBoundaryd = new THREE.LineBasicMaterial( { color: 0x01A9DB, linewidth: 2 } );
     var Bgeometry= new THREE.Object3D();
     Bgeometry.name="borderLine";
     var n=gridBoundary.length;
     //endAssociated();
     endAssociated2();
     //endAssociated3();
     for(var i=0;i<n;i++){
        var edge=new THREE.Geometry();
        var edged=new THREE.Geometry(); 
        for(var j=0;j<gridBoundary[i].associated.length;j++){
            edge.vertices.push(gridPointsArray[gridBoundary[i].index],pointSample[gridBoundary[i].associated[j]]);    
        }
        var line = new THREE.Line(edge,materialBoundary);
        Bgeometry.add(line);  
     }

     setup.scene.add(Bgeometry);   
     //endAssociated2();
 }
}
function OptimizeValence(){
        //vertex is of type VertexBounday class
        function dirDiff(vertex){
            var i=vertex.index;
            var neiborhoodIndex=getNeiboorHoodIndex(i);

            var indexP=neiborhoodIndex.indexOf(vertex.prev);
            if(indexP!=-1){
                for(var k=indexP+1;k<6+indexP;k++){
                    if(vertex.next==neiborhoodIndex[k%6]){
                        var step=k-indexP;
                        if( step==2 || step==4){
                            return 1;
                        }
                        if( step==1 || step==5){
                            return 2;
                        }
                        if( step==3){
                            return 0;
                        }
                    }  
                }
            }            
            else{
                console.log(neiborhoodIndex);
                console.log(i);
                console.log(gridI[i]);
                //console.log(indexFromBoundary(gridBoundary));
                console.log("fatal error");
                return 0;

            }

        }
        // array is a array of vertexBoundary elements
        function errorDC(array){
            var s=0;
            for(var i=0;i<array.length;i++){
                //console.log(dirDiff(array[i]));
                s=s+dirDiff(array[i]);   
            }
            return s;

        }

        function correctCorruptedEdge(dobleListBoundary){
            var n=dobleListBoundary._length;
            var toarray=dobleListBoundary.toArray();
           // var pointGeometry = new THREE.Geometry();
            //var pointmaterial = new THREE.PointsMaterial( {color: 0x000000, size: 10.0, sizeAttenuation: false, alphaTest: 0.5 } );
            for(var i=0;i<n;i++){
                var vertex=toarray[i];
                if(dirDiff(vertex)==2){
                    //console.log("corruptes found");
                    //console.log(vertex);
                    //pointGeometry.vertices.push(gridPointsArray[vertex.index]);    
                    if(dirDiff(toarray[(i-1+n)%n])!=0 || dirDiff(toarray[(i+1)%n])!=0){
                        //console.log(dobleListBoundary.positioni(vertex));
                        //console.log(i);
                        dobleListBoundary.remove(dobleListBoundary.positioni(vertex));    
                        toarray[(i-1+n)%n].next=vertex.next;
                        toarray[i].prev=vertex.prev;
                       /* var he=hemesh.vertexAdjacency[TableHashIndextoPosition[vertex.index.toString()]];
                        var facehe=hemesh.halfedgeAdjacency[he].face;*/
                        console.log(GridMeshVertexArray.length,GridMeshFacesArray.length);
                        resetGridMeshArrays(TableHashIndextoPosition[vertex.index.toString()],vertex.indexarray);
                        console.log(GridMeshVertexArray.length,GridMeshFacesArray.length);
                    }
                }
            }
            //var particles=new THREE.Points(pointGeometry,pointmaterial);
            //var particlesb=new THREE.Points(new THREE.Geometry([gridPointsArray[arrayBoundary[0].index]]),pointmaterialblack);
           // setup.scene.add(particles);

        }

        function correctConvexConcaveConvexSequence(arrayBoundary){
            var arrayconcavidade=[];
            var ternasgroup=[];
            //var dobleListBoundary=toDoubleLinkList(arrayBoundary);
            var ternas=[];
            var pointGeometry = new THREE.Geometry();
            var pointmaterial = new THREE.PointsMaterial( {color: 0x27B327, size: 10.0, sizeAttenuation: false, alphaTest: 0.5 } );

            for(var i=0;i<arrayBoundary.length;i++){
                arrayconcavidade[i]=IsReflex(i,arrayBoundary);
            }
            for(var i=0;i<arrayconcavidade.length;i++){
                if(arrayconcavidade[i]!=0){
                    ternas.push(i);
                }
            }
            //console.log(ternas.length);
            var indexObtuseinTernas=[];
            for(var i=0;i<ternas.length;i++){
                if(arrayconcavidade[ternas[i]]==1){
                    indexObtuseinTernas.push(i);
                }
            }
            for(var i=0;i<indexObtuseinTernas.length;i++){
                var n=ternas.length;   
                if((arrayconcavidade[ternas[(indexObtuseinTernas[i]-1+n)%n]]==-1) && (arrayconcavidade[ternas[(indexObtuseinTernas[i]+1)%n]]==-1)){
                  pointGeometry.vertices.push(gridPointsArray[arrayBoundary[ternas[indexObtuseinTernas[i]]].index]);    
                }
            }
            /*for(var i=0;i<indexObtuseinTernas.length;i++){
                pointGeometry.vertices.push(gridPointsArray[arrayBoundary[ternas[indexObtuseinTernas[i]]].index]);
            }*/
            var particles=new THREE.Points(pointGeometry,pointmaterial);
            //var particlesb=new THREE.Points(new THREE.Geometry([gridPointsArray[arrayBoundary[0].index]]),pointmaterialblack);
            setup.scene.add(particles);
            //setup.scene.add(particlesb);
           // console.log(ternas);
           // console.log(ternasgroup);

            console.log("pasada");
        }
        function OneStepFromBoundary(bound){
                var result=[];
                for(var j=0;j<bound.length;j++){
                    var i=bound[j].index;
                    var ibound=indexFromBoundary(bound);
                    var neiborhoodIndex=getNeiboorHoodIndex(i);
                    //console.log(neiborhoodIndex);
                    for(var k=0;k<6;k++){
                        if(neiborhoodIndex[k]>-1 && neiborhoodIndex[k]<=(height+1)*(width+1)){
                              if(!isInPolygon2(bound,gridPointsArray[neiborhoodIndex[k]]) && ibound.indexOf(neiborhoodIndex[k])==-1){
                                   result.push(neiborhoodIndex[k]);
                                }       
                        }
                    }
                }
                return result.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});
        }
        function validAdjacentVertex(feedBound,v,i){
               // var P=getBoundary2D(pointSample);
               var neiborhoodIndex=getNeiboorHoodIndex(i);
                    //console.log(neiborhoodIndex);
                var vertexIntersection=[];
                var iP=indexFromBoundary(feedBound);
                var inicio=0;
                for(var j=0;j<6;j++){
                        var indexP=iP.indexOf(neiborhoodIndex[j]);
                        if(indexP==-1){
                            inicio=j;
                            break;
                        }
                }
                    //console.log("inicio ",inicio);
                for(var j=inicio;j<inicio+6;j++){
                        //console.log("iter ", j%6);
                        var indexP=iP.indexOf(neiborhoodIndex[j%6]);
                        if(indexP!=-1){
                            vertexIntersection.push(feedBound[indexP]);
                        }
                }
                if(vertexIntersection.length>1){
                        //return indexFromBoundary(vertexIntersection);    
                        return vertexIntersection;    
                }
                else{
                        //console.log("nao cheguei");
                        return vertexIntersection;
                }
        } 
    
    
    
    var finish=false;
    var t=0;
    var finalBoundary=toDoubleLinkList(gridBoundary);
    correctCorruptedEdge(finalBoundary);
    gridBoundary=finalBoundary.toArray(); 
    while(t<2){
         moreOneStep=OneStepFromBoundary(gridBoundary);
         //console.log(moreOneStep);
         //console.log(finalBoundary.toArray());
         //console.log(gridBoundary);
         //console.log(indexFromBoundary(finalBoundary.toArray()));
         //console.log(indexFromBoundary(gridBoundary));
         var error=errorDC(gridBoundary);
         console.log(error);
         //var t=0;
         while(moreOneStep.length!=0){
             var v=moreOneStep.shift();
             var finalBoundary=toDoubleLinkList(gridBoundary);
             correctCorruptedEdge(finalBoundary);
             //console.log(finalBoundary.toArray().length);
             var varray=validAdjacentVertex(finalBoundary.toArray(),gridPointsArray[v],v);
             if(varray.length<2){continue;}    
             //var finalBoundary=toDoubleLinkList(gridBoundary.slice());
             //console.log(finalBoundary.toArray());
             growVertex(varray,finalBoundary,v,false);
             //console.log(finalBoundary.toArray().length);
             var errorAtual=errorDC(finalBoundary.toArray());
             if (error>errorAtual){
                //t++; 
                //console.log("entrei"); 
                error=errorAtual;
                gridBoundary=finalBoundary.toArray(); 
             }     
         }
         t++;
         //if(t==0){finish=true;}
         //moreOneStep=OneStepFromBoundary(gridBoundary);
    }
    //correctConvexConcaveConvexSequence(gridBoundary);
    //console.log(indexFromBoundary(gridBoundary));
    //console.log(error);
    //drawAssociated();
    //drawBoundary(gridBoundary);

}
function resetGridMeshArrays(v,f){
    var n=GridMeshVertexArray.length-1;
    var m=GridMeshFacesArray.length;
    var resultV=[];
    var resultF=[];
    
    for(var i=0;i<n;i++){
        if(i<v){
            resultV.push(GridMeshVertexArray[i]);
        }
        else{
            resultV.push(GridMeshVertexArray[i+1]);
        }
    }
    for(var j=0;j<m;j++){
        if(j!=f){
          var a=GridMeshFacesArray[j][0];
          var b=GridMeshFacesArray[j][1];
          var c=GridMeshFacesArray[j][2];
          if(a>v){a=a-1;}
          if(b>v){b=b-1;}
          if(c>v){c=c-1;}    
          resultF.push([a,b,c]);  
        }
    }
    GridMeshVertexArray=resultV;
    GridMeshFacesArray=resultF;
}

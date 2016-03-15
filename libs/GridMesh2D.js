        function mousePosition3D(event){
            // calculate mouse position in normalized device coordinates
            // (-1 to +1) for both components
            mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;		
            //console.log(mouse);
            var vector = new THREE.Vector3();
            vector.set( mouse.x ,mouse.y , 0.5 );
           // console.log("vector antes ", vector);
            vector.unproject( setup.camera);
           // console.log("vector depois ", vector);
            var dir = vector.sub( setup.camera.position ).normalize();
            //console.log("direcao ", dir);  
            var distance = - setup.camera.position.z / dir.z;
            //console.log("distancia ", distance); 
            var pos = setup.camera.position.clone().add( dir.multiplyScalar( distance ) );
            //console.log(pos);   
            return pos;
        }
        function onMouseMove() {
            event=d3.event;
            if (!isDrawing) return;
            CurrentPoint=mousePosition3D(event);
            points.push(CurrentPoint);
            //console.log(points);
            var geometryLine = new THREE.Geometry();
            geometryLine.vertices.push(LastPoint,CurrentPoint);
            LastPoint=CurrentPoint;
            var line = new THREE.Line( geometryLine, materialReal );
            LineStroke.add(line);
            //setup.scene.add( line );
        }
        function onMouseDown () {
            event=d3.event;
            isDrawing = true;
            setup.scene.add( LineStroke );
            LastPoint=mousePosition3D(event);
            points.push(LastPoint);  
        }
    
        function onMouseUp () {
             event=d3.event;
             isDrawing = false;
             //console.log(points);
             Resample(points);
             setup.scene.remove( LineStroke );
             LineStroke = new THREE.Object3D();
             points=[];
             DrawGrid();
        }
        function Resample(input_points) {
                var n=input_points.length;
                var m=Math.floor(n/5);
                var sample=[points[0]];
                for(var i=1;i<m;i++){
                    sample.push(points[i*5]);
                }
                sample.push[points[points.length-1]];
                //sample.push[points[0]];
                var curve=new THREE.CatmullRomCurve3(sample);
                var geometrySample=new THREE.Geometry();
                pointSample=curve.getPoints(Math.floor(2*input_points.length/5));
                geometrySample.vertices=pointSample;
                geometrySample.vertices.push(geometrySample.vertices[0]);
                if(LineSample!=undefined){
                    setup.scene.remove(LineSample);
                }
                LineSample = new THREE.Line( geometrySample, materialSample );
                
                setup.scene.add( LineSample);
               // console.log(pointSample);
               // console.log(geometrySample.vertices);
            
                return sample;
            
        }
        function updateSizeGrid(newVal){
            sizeGrid=newVal;
            DrawGrid();
            document.getElementById("valueexample").innerHTML=newVal;
        }
        function iv(i,j) { return i*height+i+j };
        function DrawGrid(){
            var grid2d=setup.scene.getObjectByName("Grid2D");
            if(grid2d!=undefined){
                grid2d.children=[];
            }
            //var material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} ); 
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
            var gridx=(x_max-x_min)/sizeGrid;
            var gridy=(y_max-y_min)/sizeGrid;
            width=Math.floor(gridx)+1;
            height=Math.floor(gridy)+1;
            console.log(width);
            console.log(height);
            var geoedges =[];
            starx=x_min-(width*sizeGrid-(x_max-x_min))/2;
            stary=y_min-(height*sizeGrid-(y_max-y_min))/2;
            for (var i = 0; i <= width; i++) {
					for (var j = 0; j <= height; j++) {            
                        geoedges.push(new THREE.Vector3(starx+i*sizeGrid,stary+j*sizeGrid,0.0));
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
                            geoedge.vertices.push(geoedges[iv(i-1,j-1)],geoedges[iv(i,j)]);
                            var line = new THREE.Line(geoedge,materialGrid2D);
		                    gridgeometry.add (line);
                        }
					}
        	}
            gridPointsArray=geoedges;
            setup.scene.add(gridgeometry);
            GrowingFeed();
            //console.log(geoedges[0]);
            //var got=getFeed();
            //console.log(got);
         }
         //Orientation operator for three 2d points
         //sig( |	1  1  1 |
         //		 | a0	b0 c0|
         //     | a1 b1 c1| )
         function Orientation(a,b,c) {
                var det=b[0]*c[1]-a[0]*c[1]-b[1]*c[0]+a[1]*c[0]+a[0]*b[1]-a[1]*b[0];
                if (det==0) {
                    return 0;
                }
                else if (det>0) {
                     return 1;
               }
               else {
                return -1;
               }	
         }
        //Check if v is in the Polygon P by intersect the polygon locally with a square neiborhood 
        //P: array of vertices oriented clockwise. 
         function isInPolygon(P,v){
            var relativeCoordinateX=Math.round((v.x-starx)/sizeGrid);
            var relativeCoordinateY=Math.round((v.y-stary)/sizeGrid); 
            var maxsideSquare=Math.min(width,relativeCoordinateX,height,height-relativeCoordinateY); 
            var n=P.length;
            function next(r){
                  if(j==n-1){return 0;}
                  else{return j+1;}
            }
            for(var i=1;i<=maxsideSquare;i++){
               var value=-1; 
               for (var j=0;j<=n;j++){
                   //if Pj is in the neiborhood do the orientation test
                   if (P[j].x>v.x-i*sizeGrid && P[j].x<v.x+i*sizeGrid && P[j].y>v.y-i*sizeGrid && P[j].y<v.y+i*sizeGrid ){
                       value=Orientation([v.x,v.y],[P[j].x,P[j].y],[P[next(j)].x,P[next(j)].y]);
                   }
                   console.log("i=",i);
                   break;
               }
               if (value==-1){
                   console.log("v is in");
                   return -1;
               }
               else if (value==0){
                  return 0;
               }    
               else{
                   return 1;
               }
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
        }
        function getFeed(){
            var P=getBoundary2D(pointSample);
            //walk by the first line
            var startx2D=starx;
            var starty2D=parseFloat(stary)+parseFloat(sizeGrid);
            var pointGeometry = new THREE.Geometry();
            //pointGeometry.vertices.push(new THREE.Vector3(startx2D,starty2D,0.0));
            var pointmaterial = new THREE.PointsMaterial( {color: 0x27B327, size: 10.0, sizeAttenuation: false, alphaTest: 0.5 } );
            pointmaterial.color.setHSL( 1.0, 0.3, 0.7 );
            var gotFeed=false;
            var rows=1;
            var boundaryFeed=[];
            while(gotFeed==false && rows<(height-3)){
                for(var i=0;i<=width;i++){
                    //console.log("estamos en i= ",i);
                    var v={ x: startx2D +i*sizeGrid, y : starty2D};
                    //console.log("bool ", isInPolygon2(P,v)); 
                    pointGeometry.vertices=[new THREE.Vector3(v.x,v.y,0.0)];
                    //var particles = new THREE.Points( pointGeometry, pointmaterial );
                    //setup.scene.add( particles );
                    if(isInPolygon2(P,v)){
                        var v2={ x: v.x, y: parseFloat(v.y)+parseFloat(sizeGrid)};
                        var v3={ x: parseFloat(v.x)+parseFloat(sizeGrid), y: parseFloat(v.y)+2*parseFloat(sizeGrid)};
                        var v4={ x: parseFloat(v.x)+2*parseFloat(sizeGrid), y: parseFloat(v.y)+2*parseFloat(sizeGrid)};
                        var v5={ x: parseFloat(v.x)+2*parseFloat(sizeGrid), y: parseFloat(v.y)+parseFloat(sizeGrid)};
                        var v6={ x: parseFloat(v.x)+parseFloat(sizeGrid), y: v.y};

                        if(isInPolygon2(P,v2)==true && isInPolygon2(P,v3)==true && isInPolygon2(P,v4)==true && isInPolygon2(P,v5)==true && isInPolygon2(P,v6)==true ){
                            pointGeometry.vertices.push(new THREE.Vector3(v2.x,v2.y,0.0));
                            pointGeometry.vertices.push(new THREE.Vector3(v3.x,v3.y,0.0));
                            pointGeometry.vertices.push(new THREE.Vector3(v4.x,v4.y,0.0));
                            pointGeometry.vertices.push(new THREE.Vector3(v5.x,v5.y,0.0));
                            pointGeometry.vertices.push(new THREE.Vector3(v6.x,v6.y,0.0));
                            var particle=new THREE.Points(pointGeometry, pointmaterial);
                            setup.scene.add(particle);
                            var neiborhoodIndex=[];
                            neiborhoodIndex[0]=rows+(height+1)*i;
                            neiborhoodIndex[1]=rows+(height+1)*i+1;
                            neiborhoodIndex[2]=rows+(height+1)*(i+1)+2;
                            neiborhoodIndex[3]=rows+(height+1)*(i+2)+2;
                            neiborhoodIndex[4]=rows+(height+1)*(i+2)+1;
                            neiborhoodIndex[5]=rows+(height+1)*(i+1);
                            boundaryFeed.push(new vertexBoundary(v.x,v.y,neiborhoodIndex[0],neiborhoodIndex[5],neiborhoodIndex[1],0)); 
                            boundaryFeed.push(new vertexBoundary(v2.x,v2.y,neiborhoodIndex[1],neiborhoodIndex[0],neiborhoodIndex[2],1)); 
                            boundaryFeed.push(new vertexBoundary(v3.x,v3.y,neiborhoodIndex[2],neiborhoodIndex[1],neiborhoodIndex[3],2)); 
                            boundaryFeed.push(new vertexBoundary(v4.x,v4.y,neiborhoodIndex[3],neiborhoodIndex[2],neiborhoodIndex[4],3)); 
                            boundaryFeed.push(new vertexBoundary(v5.x,v5.y,neiborhoodIndex[4],neiborhoodIndex[3],neiborhoodIndex[5],4)); 
                            boundaryFeed.push(new vertexBoundary(v6.x,v6.y,neiborhoodIndex[5],neiborhoodIndex[4],neiborhoodIndex[0],5)); 
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
                starty2D=parseFloat(starty2D)+parseFloat(sizeGrid);
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
        
        function growVertex(varray,boundaryDoubleLinkList,v){
          
                  switch(varray.length){
                      case 2: //console.log(finalBoundary.toArray());
                              if(varray[1].next==varray[0].index){
                                  boundaryDoubleLinkList.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[1].index,varray[0].index,0),boundaryDoubleLinkList.positioni(varray[1]));   
                                  varray[1].next=v;
                                  varray[0].prev=v;
                              }
                              else{
                                  boundaryDoubleLinkList.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[0].index,varray[1].index,0),boundaryDoubleLinkList.positioni(varray[0]));   
                                  varray[0].next=v;
                                  varray[1].prev=v;
                              }
                              break;
                     
                      case 3: 
                              if(varray[1].next==varray[0].index){
                                  boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[1]));
                                  boundaryDoubleLinkList.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[2].index,varray[0].index,0),boundaryDoubleLinkList.positioni(varray[2]));   
                                  varray[2].next=v;
                                  varray[0].prev=v;
                              }
                              else{
                                  boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[1]));
                                  boundaryDoubleLinkList.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[0].index,varray[2].index,0),boundaryDoubleLinkList.positioni(varray[0]));   
                                  varray[0].next=v;
                                  varray[2].prev=v;
                              }
                              break;
                      case 4: 
                              if(varray[1].next==varray[0].index){
                                  boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[2]));
                                  boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[1]));
                                  boundaryDoubleLinkList.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[3].index,varray[0].index,0),boundaryDoubleLinkList.positioni(varray[3]));   
                                  varray[3].next=v;
                                  varray[0].prev=v;
                              }
                              else{
                                  boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[2]));
                                  boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[1]));
                                  boundaryDoubleLinkList.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[0].index,varray[3].index,0),boundaryDoubleLinkList.positioni(varray[0]));   
                                  varray[0].next=v;
                                  varray[3].prev=v;
                              }
            
                              break;
                      
                      case 5: 
                              if(varray[1].next==varray[0].index){
                                  boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[3]));
                                  boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[2]));
                                  boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[1]));
                                  
                                  boundaryDoubleLinkList.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[4].index,varray[0].index,0),boundaryDoubleLinkList.positioni(varray[4]));   
                                  varray[4].next=v;
                                  varray[0].prev=v;
                              }
                              else{
                                  boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[3]));
                                  boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[2]));
                                  boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[1]));
                                  boundaryDoubleLinkList.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[0].index,varray[4].index,0),boundaryDoubleLinkList.positioni(varray[0]));   
                                  varray[0].next=v;
                                  varray[4].prev=v;
                              }
                             
                              break;                      
                          
                      case 6: if(varray[1].next==varray[0].index){
                                  boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[4]));
                                  boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[3]));
                                  boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[2]));
                                  boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[1]));
                                  boundaryDoubleLinkList.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[5].index,varray[0].index,0),boundaryDoubleLinkList.positioni(varray[5]));   
                                  varray[5].next=v;
                                  varray[0].prev=v;
                              }
                              else{
                                  boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[4]));
                                  boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[3]));
                                  boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[2]));
                                  boundaryDoubleLinkList.remove(boundaryDoubleLinkList.positioni(varray[1]));
                                  boundaryDoubleLinkList.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[0].index,varray[5].index,0),boundaryDoubleLinkList.positioni(varray[0]));   
                                  varray[0].next=v;
                                  varray[5].prev=v;
                              }
                               break;
                  }     
              
        }
        function GrowingFeed(){
            var feed=getFeed();
            if (feed[0]==false){
                console.log("nao tem semente");
            }
            else{ //console.log(feed[1]);
                /*
                function toVertexBoundary(array){
                    var result=[];
                    for(var i=0;i<array.length;i++){
                        result.push(new vertexBoundary(array.x,array.y,2,3));
                    }
                }*/
                materialBoundary = new THREE.LineBasicMaterial( { color: 0x27B327, linewidth: 2 } );
                function drawBoundary(array){
                     var Bgeometry= new THREE.Object3D();
                     for(var i=0;i<array.length;i++){
                        var edge=new THREE.Geometry();
                        edge.vertices.push(gridPointsArray[array[i].index],gridPointsArray[array[i].next]);
                        var line = new THREE.Line(edge,materialBoundary);
                        Bgeometry.add(line);    
                     }
                     setup.scene.add(Bgeometry);
                }
                //drawBoundary(feed[1]);
                function indexFromBoundary(P){
                    var indexP=[];
                    for(var i=0;i<P.length;i++){
                        indexP[i]=P[i].index;
                    }
                    return indexP;
                }
                //check if a vertex v is valid for the Boundary feedBound
                // i is the index of v in the gridPointsArray
                //return  index of the intersection of the vertex in  clockwise or  
                function validAdjacentVertex(feedBound,v,i){
                    var P=getBoundary2D(pointSample);
                    if(isInPolygon2(P,v)){
                        var neiborhoodIndex=[i-2-height,i-1-height,i+1,i+height+2,i+height+1,i-1];
                        //console.log(neiborhoodIndex);
                        var vertexIntersection=[];
                        var iP=indexFromBoundary(feedBound);
                        var inicio=0;
                        for(var j=0;j<6;j++){
                            var indexP=iP.indexOf(neiborhoodIndex[j]);
                            if(indexP==-1){
                                inicio=j;
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
                function addNeiborFromVertex(P,bound,i){
                        var ibound=indexFromBoundary(bound);
                        var neiborhoodIndex=[i-2-height,i-1-height,i+1,i+height+2,i+height+1,i-1];
                        var result=[];
                        //console.log(neiborhoodIndex);
                        for(var k=0;k<6;k++){
                           if(!isInPolygon2(bound,gridPointsArray[neiborhoodIndex[k]]) && isInPolygon2(P,gridPointsArray[neiborhoodIndex[k]]) && ibound.indexOf(neiborhoodIndex[k])==-1){
                               result.push(neiborhoodIndex[k]);
                            }    
                        }
                        return result;
                }
                //Get the first grid vertex  out from the polygon bound
                // give the index of them
                function getOutVertexFromBoundary(P,bound){
                    var result=[];
                    for(var j=0;j<bound.length;j++){
                        var i=bound[j].index;
                        var ibound=indexFromBoundary(bound);
                        var neiborhoodIndex=[i-2-height,i-1-height,i+1,i+height+2,i+height+1,i-1];
                        //console.log(neiborhoodIndex);
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
                  //console.log(indexFromBoundary(varray));    
                  /*
                  switch(varray.length){
                      case 2: //console.log(finalBoundary.toArray());
                              if(varray[1].next==varray[0].index){
                                  finalBoundary.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[1].index,varray[0].index,0),finalBoundary.positioni(varray[1]));   
                                  varray[1].next=v;
                                  varray[0].prev=v;
                              }
                              else{
                                  finalBoundary.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[0].index,varray[1].index,0),finalBoundary.positioni(varray[0]));   
                                  varray[0].next=v;
                                  varray[1].prev=v;
                              }
                              break;
                     
                      case 3: 
                              if(varray[1].next==varray[0].index){
                                  finalBoundary.remove(finalBoundary.positioni(varray[1]));
                                  finalBoundary.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[2].index,varray[0].index,0),finalBoundary.positioni(varray[2]));   
                                  varray[2].next=v;
                                  varray[0].prev=v;
                              }
                              else{
                                  finalBoundary.remove(finalBoundary.positioni(varray[1]));
                                  finalBoundary.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[0].index,varray[2].index,0),finalBoundary.positioni(varray[0]));   
                                  varray[0].next=v;
                                  varray[2].prev=v;
                              }
                              break;
                      case 4: 
                              if(varray[1].next==varray[0].index){
                                  finalBoundary.remove(finalBoundary.positioni(varray[2]));
                                  finalBoundary.remove(finalBoundary.positioni(varray[1]));
                                  finalBoundary.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[3].index,varray[0].index,0),finalBoundary.positioni(varray[3]));   
                                  varray[3].next=v;
                                  varray[0].prev=v;
                              }
                              else{
                                  finalBoundary.remove(finalBoundary.positioni(varray[2]));
                                  finalBoundary.remove(finalBoundary.positioni(varray[1]));
                                  finalBoundary.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[3].index,varray[0].index,0),finalBoundary.positioni(varray[0]));   
                                  varray[0].next=v;
                                  varray[3].prev=v;
                              }
                              var a1=stackBoundayToProcess.concat(addNeiborFromVertex(P,finalBoundary.toArray(),v));
                              stackBoundayToProcess=a1.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});
                              //console.log(stackBoundayToProcess);
                              break;
                      
                      case 5: 
                              if(varray[1].next==varray[0].index){
                                  finalBoundary.remove(finalBoundary.positioni(varray[3]));
                                  finalBoundary.remove(finalBoundary.positioni(varray[2]));
                                  finalBoundary.remove(finalBoundary.positioni(varray[1]));
                                  
                                  finalBoundary.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[4].index,varray[0].index,0),finalBoundary.positioni(varray[4]));   
                                  varray[4].next=v;
                                  varray[0].prev=v;
                              }
                              else{
                                  finalBoundary.remove(finalBoundary.positioni(varray[3]));
                                  finalBoundary.remove(finalBoundary.positioni(varray[2]));
                                  finalBoundary.remove(finalBoundary.positioni(varray[1]));
                                  finalBoundary.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[0].index,varray[4].index,0),finalBoundary.positioni(varray[0]));   
                                  varray[0].next=v;
                                  varray[4].prev=v;
                              }
                              var a1=stackBoundayToProcess.concat(addNeiborFromVertex(P,finalBoundary.toArray(),v));
                              stackBoundayToProcess=a1.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});
                              //console.log(stackBoundayToProcess);
                              break;                      
                          
                      case 6: if(varray[1].next==varray[0].index){
                                  finalBoundary.remove(finalBoundary.positioni(varray[4]));
                                  finalBoundary.remove(finalBoundary.positioni(varray[3]));
                                  finalBoundary.remove(finalBoundary.positioni(varray[2]));
                                  finalBoundary.remove(finalBoundary.positioni(varray[1]));
                                  finalBoundary.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[5].index,varray[0].index,0),finalBoundary.positioni(varray[5]));   
                                  varray[5].next=v;
                                  varray[0].prev=v;
                              }
                              else{
                                  finalBoundary.remove(finalBoundary.positioni(varray[4]));
                                  finalBoundary.remove(finalBoundary.positioni(varray[3]));
                                  finalBoundary.remove(finalBoundary.positioni(varray[2]));
                                  finalBoundary.remove(finalBoundary.positioni(varray[1]));
                                  finalBoundary.addi(new vertexBoundary(gridPointsArray[v].x,gridPointsArray[v].y,v,varray[0].index,varray[5].index,0),finalBoundary.positioni(varray[0]));   
                                  varray[0].next=v;
                                  varray[5].prev=v;
                              }
                              var a1=stackBoundayToProcess.concat(addNeiborFromVertex(P,finalBoundary.toArray(),v));
                              stackBoundayToProcess=a1.filter(function(elem, pos, self) {return self.indexOf(elem) == pos;});
                              //console.log(stackBoundayToProcess);
                              break;       
                      default: continue;
                  }    
                  */
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
                //drawBoundary(finalBoundary.toArray());
                gridBoundary=finalBoundary.toArray();
                //drawBoundary(gridBoundary);
                //MappingVerteToStroke();
                OptimizeValence();
               // console.log(stackBoundayToProcess);
                
            }
            
        }
        
        function MappingVerteToStroke(){
            
                //Compute the curvature of the vertex like the Discrete Gradient of Arc Length. For example in
                // http://www.cs.utexas.edu/users/evouga/uploads/4/5/6/8/45689883/notes1.pdf
                //lvertex,vertex and rvertex are three vertex consecutives
                function CurvatureVertex(lvertex,vertex,rvertex){
                    var vl=Victor.fromArray([lvertex.x,lvertex.y]);
                    var vc=Victor.fromArray([vertex.x,vertex.y]);
                    var vr=Victor.fromArray([rvertex.x,rvertex.y]);
                    var v1=vc.subtract(vl);
                    var v2=vr.subtract(vc);
                    var mod1=v1.length();
                    var mod2=v2.length();
                    var angle= Math.acos(v1.dot(v2)/(mod1*mod2));
                    //console.log(Math.sin(angle));
                    return (4*Math.sin(angle/2)/(mod1+mod2));
                }
                //return the index of the nearest grid point to vertex
                function findNearGridVertex(vertex){
                    var i=Math.floor((vertex.x-starx)/sizeGrid);
                    var j=Math.floor((vertex.y-stary)/sizeGrid);
                    var point=Victor.fromArray([vertex.x,vertex.y]);
                    var v0=Victor.fromArray([gridPointsArray[iv(i,j)].x,gridPointsArray[iv(i,j)].y]);
                    var v1=Victor.fromArray([gridPointsArray[iv(i+1,j)].x,gridPointsArray[iv(i+1,j)].y]);
                    var v2=Victor.fromArray([gridPointsArray[iv(i,j+1)].x,gridPointsArray[iv(i,j+1)].y]);
                    var v3=Victor.fromArray([gridPointsArray[iv(i+1,j+1)].x,gridPointsArray[iv(i+1,j+1)].y]);
                    var neiborhood=[v0,v1,v2,v3];
                    var min=point.distance(v0);
                    var imin=iv(i,j);
                    for(var k=1;k<4;k++){
                        var d=point.distance(neiborhood[k]);
                        if(d<min){
                            min=d;
                            if(k==1){imin=iv(i+1,j);}
                            if(k==2){imin=iv(i,j+1);}
                            if(k==3){imin=iv(i+1,j+1);}
                        }
                    }
                    return imin;
                }
                
            var n=pointSample.length;
            console.log("sample ", n-1);
            //console.log("sample0 ", pointSample[0]);
            //console.log("samplen-1 ", pointSample[n-2]);
            var curvatures=[[0,CurvatureVertex(pointSample[n-2],pointSample[0],pointSample[1])],[n-2,CurvatureVertex(pointSample[n-2],pointSample[n-1],pointSample[0])]];
            for(var i=1;i<n-2;i++){
                curvatures.push([i,CurvatureVertex(pointSample[i-1],pointSample[i],pointSample[i+1])]);
            }
            curvatures.sort(function(a, b){return b[1]-a[1]});
            //console.log(curvatures);
            var m=gridBoundary.length;
            console.log("gridpoint ", m);
            //index correspond to index of pointSampleIndex 
            var AssociateGridPoints=[];
            var pointSampleIndex=[];
            for(var j=0;j<Math.min(m,n-1);j++){
                AssociateGridPoints[j]=findNearGridVertex(pointSample[curvatures[j][0]]);
                pointSampleIndex[j]=curvatures[j][0];
            }
            console.log(AssociateGridPoints);
            return AssociateGridPoints;
        }
        
        function OptimizeValence(){
            //vertex is of type VertexBounday class
            function dirDiff(vertex){
                var i=vertex.index;
                var neiborhoodIndex=[i-2-height,i-1-height,i+1,i+height+2,i+height+1,i-1];
                var indexP=neiborhoodIndex.indexOf(vertex.prev);
                for(var k=indexP+1;k<6+indexP;k++){
                    if(indexP!=-1){
                        if(vertex.next==neiborhoodIndex[k%6]);{
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
                    else{
                        return "fatal error";
                            
                    }
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
            //console.log(errorDC(gridBoundary));
            function indexFromBoundary(P){
                    var indexP=[];
                    for(var i=0;i<P.length;i++){
                        indexP[i]=P[i].index;
                    }
                    return indexP;
            }
            function drawBoundary(array){
                     var Bgeometry= new THREE.Object3D();
                     var materialBoundary = new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 2 } );
                     for(var i=0;i<array.length;i++){
                        var edge=new THREE.Geometry();
                        edge.vertices.push(gridPointsArray[array[i].index],gridPointsArray[array[i].next]);
                        var line = new THREE.Line(edge,materialBoundary);
                        Bgeometry.add(line);    
                     }
                     setup.scene.add(Bgeometry);
            }
            function OneStepFromBoundary(bound){
                    var result=[];
                    for(var j=0;j<bound.length;j++){
                        var i=bound[j].index;
                        var ibound=indexFromBoundary(bound);
                        var neiborhoodIndex=[i-2-height,i-1-height,i+1,i+height+2,i+height+1,i-1];
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
                    var neiborhoodIndex=[i-2-height,i-1-height,i+1,i+height+2,i+height+1,i-1];
                        //console.log(neiborhoodIndex);
                    var vertexIntersection=[];
                    var iP=indexFromBoundary(feedBound);
                    var inicio=0;
                    for(var j=0;j<6;j++){
                            var indexP=iP.indexOf(neiborhoodIndex[j]);
                            if(indexP==-1){
                                inicio=j;
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
            var finish=false;
            
            while(!finish){
                 moreOneStep=OneStepFromBoundary(gridBoundary);
                 //console.log(moreOneStep);
                 //console.log(finalBoundary.toArray());
                 //console.log(gridBoundary);
                 //console.log(indexFromBoundary(finalBoundary.toArray()));
                 //console.log(indexFromBoundary(gridBoundary));
                //drawBoundary(gridBoundary);
                 var error=errorDC(gridBoundary);
                 console.log(error);
                 var t=0;
                 while(moreOneStep.length!=0){
                     var v=moreOneStep.shift();
                     var finalBoundary=toDoubleLinkList(gridBoundary);
                     console.log(finalBoundary.toArray().length);
                     var varray=validAdjacentVertex(finalBoundary.toArray(),gridPointsArray[v],v);
                     if(varray.length<2){continue;}    
                     //var finalBoundary=toDoubleLinkList(gridBoundary.slice());
                     //console.log(finalBoundary.toArray());
                     growVertex(varray,finalBoundary,v);
                     console.log(finalBoundary.toArray().length);
                     var errorAtual=errorDC(finalBoundary.toArray());
                     if (error>errorAtual){
                        t++; 
                        console.log("entrei"); 
                        error=errorAtual;
                        gridBoundary=finalBoundary.toArray(); 
                     }     
                 }
                 if(t==0){finish=true;}
                 //moreOneStep=OneStepFromBoundary(gridBoundary);
            }
            //console.log(indexFromBoundary(gridBoundary));
            console.log(error);
            //drawBoundary(gridBoundary);
        }

        var canvaswindows=d3.select("canvas");
        canvaswindows.on("mousedown",onMouseDown);
        canvaswindows.on("mouseup",onMouseUp);
        canvaswindows.on("mousemove",onMouseMove);
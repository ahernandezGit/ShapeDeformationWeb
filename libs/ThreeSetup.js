var ThreeSetup = function() {
	this.scene = new THREE.Scene();
	this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    //this.camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2,  window.innerHeight / 2, window.innerHeight / -2, 0.1, 100);
	this.controls = new THREE.TrackballControls(this.camera);
	this.renderer = new THREE.WebGLRenderer({ antialias:true });
	
	this.initControls();
	this.initRenderer();
	this.initCamera();
}

ThreeSetup.prototype.initControls = function() {
	this.controls.rotateSpeed = 1.0;
	this.controls.zoomSpeed = 1.2;
	this.controls.panSpeed = 1.8;
	this.controls.noZoom = false;
	this.controls.noPan = false;
	this.controls.staticMoving = true;
	this.controls.dynamicDampingFactor = 0.3;
	this.controls.keys = [ 65, 83, 68 ];
}

ThreeSetup.prototype.initRenderer = function() {
	this.renderer.setClearColor(0xeeeeee);
	this.renderer.setSize(window.innerWidth, window.innerHeight);
		console.log
	document.body.appendChild(this.renderer.domElement);
}

ThreeSetup.prototype.initCamera = function() {
	this.camera.position.z = 20;
}

ThreeSetup.prototype.resize = function() {
	this.camera.aspect = window.innerWidth/window.innerHeight;
	this.camera.updateProjectionMatrix();
	this.renderer.setSize(window.innerWidth, window.innerHeight);
	this.controls.handleResize();
}

ThreeSetup.prototype.render = function() {
    if(ModeCurveDeformation){
        flagIntersectionCurve=false;
        raycasterCurve.setFromCamera( mouse, setup.camera );
        //raycasterCurve.linePrecision=sizeGrid/8;
        var mesh=setup.scene.getObjectByName("mesh");
        var intersects = raycasterCurve.intersectObject(mesh);
        var pointGeometry = new THREE.Geometry();
        var whatcurve=-1;
        var whatpoint=-1;
        var whatindex=-1;
        if ( intersects.length > 0 ) {
            var intersect = intersects[0];
            var a=intersect.face.a;
            var b=intersect.face.b;
            var c=intersect.face.c;
            for(var i=0;i<ListOfCurves.length;i++){
                for(var j=ListOfCurves[i][0];j<=ListOfCurves[i][1];j++){
                    if(a==FixedVertex[j]){
                        var other=-1;
                        whatcurve=i;
                        var j1=j+1;
                        var jm1=j-1;
                        if(j1==ListOfCurves[i][1]+1){
                            j1=ListOfCurves[i][0];
                        }
                        if(jm1==ListOfCurves[i][0]-1){
                            jm1=ListOfCurves[i][1];
                        }    
                        if(b==FixedVertex[j1] || b==FixedVertex[jm1]){
                            other=b;
                        }
                        else if(c==FixedVertex[j1] || c==FixedVertex[jm1]){
                            other=c;
                        }
                        var da=hemesh.positions[a].distanceTo(intersect.point);
                        if(other!=-1){
                            var dother=hemesh.positions[other].distanceTo(intersect.point);
                            if(da<dother){
                              whatpoint=a;   
                              whatindex=j;    
                            }
                            else{
                                whatpoint=other;
                                if(other==FixedVertex[j1]){whatindex=j1;}
                                else{whatindex=jm1;}
                            }
                        }
                        else{
                            whatpoint=a;
                            whatindex=j; 
                        }
                        canvaswindows.style('cursor','pointer');
                        flagIntersectionCurve=true;
                        
                        break;
                    }
                    else if(b==FixedVertex[j]){
                        var other=-1;
                        whatcurve=i;
                        var j1=j+1;
                        var jm1=j-1;
                        if(j1==ListOfCurves[i][1]+1){
                            j1=ListOfCurves[i][0];
                        }
                        if(jm1==ListOfCurves[i][0]-1){
                            jm1=ListOfCurves[i][1];
                        }    
                        if(a==FixedVertex[j1] || a==FixedVertex[jm1]){
                            other=a;
                        }
                        else if(c==FixedVertex[j1] || c==FixedVertex[jm1]){
                            other=c;
                        }
                        var db=hemesh.positions[b].distanceTo(intersect.point);
                        if(other!=-1){
                            var dother=hemesh.positions[other].distanceTo(intersect.point);
                            if(db<dother){
                              whatpoint=b;   
                              whatindex=j;  
                            }
                            else{
                                whatpoint=other;
                                if(other==FixedVertex[j1]){whatindex=j1;}
                                else{whatindex=jm1;}
                            }
                        }
                        else{
                            whatpoint=b;
                            whatindex=j; 
                        }
                        canvaswindows.style('cursor','pointer');
                        flagIntersectionCurve=true;
                        break;    
                    }
                    else if(c==FixedVertex[j]){
                        var other=-1;
                        whatcurve=i;
                        var j1=j+1;
                        var jm1=j-1;
                        if(j1==ListOfCurves[i][1]+1){
                            j1=ListOfCurves[i][0];
                        }
                        if(jm1==ListOfCurves[i][0]-1){
                            jm1=ListOfCurves[i][1];
                        }    
                        if(b==FixedVertex[j1] || b==FixedVertex[jm1]){
                            other=b;
                        }
                        else if(a==FixedVertex[j1] || a==FixedVertex[jm1]){
                            other=a;
                        }
                        var dc=hemesh.positions[c].distanceTo(intersect.point);
                        if(other!=-1){
                            var dother=hemesh.positions[other].distanceTo(intersect.point);
                            if(dc<dother){
                              whatpoint=c;   
                              whatindex=j; 
                            }
                            else{
                                whatpoint=other;
                                if(other==FixedVertex[j1]){whatindex=j1;}
                                else{whatindex=jm1;}
                            }
                        }
                        else{
                            whatpoint=c;
                            whatindex=j; 
                        }
                        canvaswindows.style('cursor','pointer');
                        flagIntersectionCurve=true;
                        break;    
                    }
                }
            }
          
        }
        else {
            flagIntersectionCurve=false;
        }
        
        if(flagIntersectionCurve){
            if(!isDeforming){
                ListOfCurvesObject[whatcurve].material.color.set(0xDF7401);
                pointGeometry.vertices.push(hemesh.positions[whatpoint]);
                //pointGeometry.vertices.push(intersect.object.geometry.vertices[p2]);
                var pointmaterial = new THREE.PointsMaterial( {color: 0x27B327, size: 10.0, sizeAttenuation: false, alphaTest: 0.5 } );

                var particlesC=setup.scene.getObjectByName("intersectPoints"); 
                if(particlesC!=undefined){
                    setup.scene.remove( particlesC );
                }

                particlesC = new THREE.Points( pointGeometry, pointmaterial );
                particlesC.name="intersectPoints";
                setup.scene.add( particlesC );
                indexPointToEdit=whatpoint;
                indexCurvetoEdit=whatcurve;
                indexPointEditInFixedVertex=whatindex;
            }
            
        }
        else{
            if(!isDeforming){
                //ListOfCurvesObject[whatcurve].material.color.set(0x0015FF);
                canvaswindows.style('cursor','default');
                var particlesC=setup.scene.getObjectByName("intersectPoints"); 
                ListOfCurvesObject[0].material.color.set(0x0015FF);
                if(particlesC!= undefined){
                    setup.scene.remove( particlesC );
                }
                indexPointToEdit=-1;
                indexCurvetoEdit=-1;
                indexPointEditInFixedVertex=-1;
            }
        }
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
}
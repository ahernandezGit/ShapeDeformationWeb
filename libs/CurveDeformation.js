// two index in FixedVErtex that store the begining and end of wich curve 
var ListOfCurves=[];
var ListOfCurvesGeometry=[];
var ListOfCurvesObject=[];
function planeToDeforming(normal,x,y,z,v){
    this.normal=new THREE.Vector3(normal.x,normal.y,normal.z);
    this.point=new THREE.Vector3(x,y,z);
    this.indexp=v;
}
function updateROI(){
    var vector = new THREE.Vector3();
    vector.set( mouse.x ,mouse.y , 0.5 );
    vector.unproject( setup.camera);
    var cameraposition=setup.camera.position.clone();
    var dir = vector.sub(cameraposition).normalize();
    var t=plane.point.clone().sub(cameraposition).dot(plane.normal)/dir.dot(plane.normal);
    var point=cameraposition.add(dir.multiplyScalar(t));
    sphereMouse.position.set(point.x,point.y,point.z);
}
//part of the mesh to be edit
//v:index in hemesh.positions of the handle
//r: radius of the ROI
function pathToEdit(r,v){
    this.radius=r;
    this.freevertex=[];
    this.fixed=[];
    this.handle=v;
    //this.computeVertex();
    
}
pathToEdit.prototype.computeVertex=function (){
        var h=hemesh.vertexHalfedge(this.handle);
        var vertexs=[];
        var v=this.handle;
        var r=this.radius;
        hemesh.vertexCirculator(function(he){
            var vxt=hemesh.halfedgeSource(he);
            var center=hemesh.positions[v];
            var pv=hemesh.positions[vxt];
            //console.log(center);
            //console.log(pv);
            //console.log("dentro circulator");
            console.log(pv.distanceTo(center));
            //console.log(r);
            if(pv.distanceTo(center)<r){
                vertexs.push(vxt);
                //console.log(vxt);
            }
        },h);
        //console.log(vertexs);
        var stack=vertexs.slice();
        //console.log(stack);
        while(stack.length!=0){
            var vc=stack.pop();
            var center=hemesh.positions[vc];
            var h=hemesh.vertexHalfedge(vc);
            hemesh.vertexCirculator(function(he){
                var vxt=hemesh.halfedgeSource(he);
                var pv=hemesh.positions[vxt];
                if(pv.distanceTo(center)<r){
                    vertexs.push(vxt);
                    stack.push(vxt);
                }
            },h);
        }
        var n=vertexs.length;
        this.freevertex=vertexs.slice(0,n-2);
        this.fixed=[vertexs[n-2],vertexs[n-1]];
        console.log(this.freevertex);
        console.log(this.fixed);    
}
pathToEdit.prototype.setradius=function(nr){
       this.radio=nr;
       this.computeVertex();
       console.log(this.freevertex);
       console.log(this.fixed);
}    
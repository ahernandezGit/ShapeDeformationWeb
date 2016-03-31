 GridVertex={};
 GridEdge={};
 GridFace={};
 

 function GridMesh () {
	if (!(this instanceof GridMesh)) {
		return new GridMesh();
	}
    this.w = 50;
    this.h = (this.w * Math.sqrt(3.0)) / 2.0;
    this.ratio = Math.sqrt(3) / 3;
    this.boundary_points = [];
    this.skip_points = [];
     
 }
//points: array of 2d points (array [x,y]) 
 GridMesh.prototype.ConstructMesh=function(points){
    var total_length = 0.0; 
    for(var i=0;i<=points.length;i++){
       var v0 = new Victor.fromArray(points[i]);
       var j=((i+1) % points.length);    
       var v1 = new Victor.fromArray(points[j]);    
       total_length += v0.distance(v1);
    }
    var unit_length = total_length / points.length;
    this.w = unit_length;
    this.h = (w * Math.sqrt(3.0)) / 2.0;
    var grid_points = collect_nearest_grid_points(points);
    grid_points = remove_collapsed(grid_points);
    var grid_points_with_skip_points = insert_skip_points(grid_points);
    var boundary_points = grid_points;
    generate_mesh(grid_points_with_skip_points);
    stitch(mesh, grid_points_with_skip_points, points);
    remove_valence_4_vertices_near_boundary(mesh);
 }  
 //input_points: array of 2d points (array [x,y]) 
 GridMesh.prototype.collect_nearest_grid_points=function(input_points){
    var points=[];
    var prev_u = new GridVertex(); 
    
 }

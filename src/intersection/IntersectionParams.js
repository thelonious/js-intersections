/*****
*
*   IntersectionParams.js
*
*   copyright 2002, Kevin Lindsey
*
*****/

/*****
*
*   constructor
*
*****/
function IntersectionParams(name, params) {
    if ( arguments.length > 0 )
        this.init(name, params);
}


/*****
*
*   init
*
*****/
IntersectionParams.prototype.init = function(name, params) {
    this.name   = name;
    this.params = params;
};


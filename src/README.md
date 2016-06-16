## _Overview of sprinting/src_

The top-level files here (i.e those not in draw) are those to be used by the average Sprinting user. This is why, although there's a draw directory, things.shapes and things.shapes.x still live in here.  
In draw, you'll instead find the files for the drawing APIs for the separate ways to draw (canvas and DOM), as well as a file putting the functionality of the two together. This API is more complicated and thus less beginner-friendly, but everything in it is used by the various top-level files to provide a more user- (especially beginner-)friendly API.

$(document).ready(function() {
    
    const FRAME_RATE = 200;
    const FRAME_SIZE = 500;
    const IMG_QUALITY= 0.75;
    const LINE_WIDTH = 30;
    let namespace = "/demo";

    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);
    
    const canvas = document.querySelector("#inputCanvas");
    const prediction = document.querySelector("#prediction");

    canvas.width = FRAME_SIZE;
    canvas.height = FRAME_SIZE;
    let ctx = canvas.getContext('2d');
    ctx.fillStyle = "black";
    ctx.strokeStyle = "white";
    ctx.lineWidth = LINE_WIDTH;
    ctx.fillRect(0, 0, FRAME_SIZE, FRAME_SIZE);
    

    setInterval(function () {
        sendFrame();
    }, FRAME_RATE);

    socket.on('packet_from_py',function(data){
        prediction.innerHTML = data.class_name
    });
        
    function sendFrame(){
        let dataURL = canvas.toDataURL('image/jpeg', IMG_QUALITY);
        socket.emit('packet_from_js', dataURL);
    };

    let isDrawing = false;
    let startX;
    let startY;
    let last_x = 0;
    let last_y = 0;
    let s = 0;
    let lines = []
    
    canvas.addEventListener('mousedown', function(e) {
        startX = e.offsetX;
        startY = e.offsetY;
        isDrawing = true;
        console.log("starts painting ")
        
        last_x = startX
        last_y = startY
        let line = []
        let points = {x:startX,y:startY}
        line.push(points)
        lines.push(line)
        s+=1;
    });
    canvas.addEventListener('mousemove', function(e) {
        if (isDrawing === true) {
            startX = e.offsetX;
            startY = e.offsetY;
    
            if (!(last_x == startX && last_y == startY)){
                let points = {x:startX, y:startY}
                lines[lines.length-1].push(points)
                s+=1;
                last_x = startX
                last_y = startY
            }
        }
    });
    canvas.addEventListener('mouseup', function(e) {
        if (isDrawing === true) {
            startX = 0;
            startY = 0;
            isDrawing = false;
            console.log("end painting")
        }
    });
    canvas.addEventListener('mouseout', function(e) {
        if (isDrawing === true) {
            startX = 0;
            startY = 0;
            isDrawing = false;
            console.log("end painting")
        }
    });

    function animate(timestamp) {
  
      drawLines();
      removeLines();
      requestAnimationFrame(animate);
    }
    
    requestAnimationFrame(animate);
    
    
    function drawLines(){
        if (lines.length == 0){return;}
        ctx.fillRect(0, 0, FRAME_SIZE, FRAME_SIZE);
        for (var i=0; i<lines.length; i++){
            let thisLine = lines[i]
            if (lines[i].length == 1){
                ctx.fillRect(thisLine[0].x,thisLine[0].y,3,3)
            } else {
                ctx.beginPath();
                ctx.moveTo(thisLine[0].x,thisLine[0].y);
                for (var n=0; n<thisLine.length; n++){
                    ctx.lineTo(thisLine[n].x,thisLine[n].y);   
                }
                ctx.stroke();
                ctx.closePath();   
            }
        }
    }


    let clear_count = 0;
    let wait_amount = 4;
    
    function removeLines(){
        if (clear_count >= wait_amount){
            clear_count = 0;
            if (s >= 1){
                if (lines[0].length>1){
                    lines[0].shift()
                } else {
                    if (lines.length > 1){
                        lines.shift()
                    }
                }
                s -= 1;
            }
        } else {
            clear_count += 1;
        }
    }
    
});
$(document).ready(function() {
    
    const FRAME_RATE = 200;
    const FRAME_SIZE = 500;
    const IMG_QUALITY= 0.75;
    let namespace = "/demo";

    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port + namespace);
    
    const canvas = document.querySelector("#inputCanvas");
    const video = document.querySelector("#videoElement");
    const prediction = document.querySelector("#prediction");

    canvas.width = FRAME_SIZE;
    canvas.height = FRAME_SIZE;
    let ctx = canvas.getContext('2d');
    ctx.translate(FRAME_SIZE,0);
    ctx.scale(-1,1);

    
    var constraints = {
        audio: false,
        video: {width: FRAME_SIZE, height: FRAME_SIZE}
    };
    
    
    var localMediaStream = null;
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        video.srcObject = stream;
        localMediaStream = stream;
    
        setInterval(function () {
            sendFrame();
        }, FRAME_RATE);
    
        socket.on('packet_from_py',function(data){
            prediction.innerHTML = data.class_name
        });
        
    }).catch(function (err) {
        console.log("Error: " + err);
    });
    
    
    function sendFrame(){
        if (!localMediaStream) {
            return;
        }
        
        ctx.drawImage(video,0,0,FRAME_SIZE,FRAME_SIZE);

        let dataURL = canvas.toDataURL('image/jpeg', IMG_QUALITY);
        socket.emit('packet_from_js', dataURL);
    };

});
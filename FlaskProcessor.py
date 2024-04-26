from PIL import Image
import threading
from time import sleep
from utils import base64_to_pil_image, pil_image_to_base64

from torch.nn import Identity
import torch
from torchvision.transforms.v2 import Compose, ToImage, ToDtype, Resize, Grayscale, Normalize



class Processor(object):
    def __init__(self, model_backend, device, colour_channels = 3, img_resolution = 64, quality = 0.75):
        self.quality = int(quality*100)
        self.device = device
        self.to_process = []
        self.to_output = []
        self.model_backend = model_backend
        self.class_names = None
        
        self.transformation = Compose([   
            # convert an image to tensor
            ToImage(),
            ToDtype(torch.float32, scale=True),
            Resize(img_resolution),
            # normalise pixel values to be between -1 and 1 
            Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5)),
            Grayscale() if colour_channels == 1 else Identity()
            
        ])

        thread = threading.Thread(target=self.keep_processing, args=())
        thread.daemon = True
        thread.start()
        
        

    def process_one(self):
        if not self.to_process:
            return
        # input is an ascii string.
        input_str = self.to_process.pop(0)
        # convert it to a pil image
        input_img = base64_to_pil_image(input_str)

        ######## Calling the backend model ##########
        if input_img is not None:
            input_img = self.transformation(input_img).to(self.device).unsqueeze(0)
            predictions = self.model_backend(input_img)
            _, predicted_class_index = torch.max(predictions[0], 0)
            output_str = predicted_class_index.tolist()
            if self.class_names is None:
                self.to_output.append(output_str)
            else:
                self.to_output.append(self.class_names[output_str])


    def keep_processing(self):
        while True:
            self.process_one()
            sleep(0.01)

    def enqueue_input(self, img_from_js):
        self.to_process.append(img_from_js)

    def get_frame(self):
        if (len(self.to_output) >= 2):
            self.to_output = []
        while not self.to_output:
            return 'not ready'
        return self.to_output.pop(0)

    def set_class_name(self, class_names):
        assert self.model_backend.num_classes == len(class_names), f"number of classes doesn't match expected num_classes:{self.model_backend.num_classes}"
        
        self.class_names = class_names
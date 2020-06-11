import bpy
import json
import os
import shutil
import uuid
from pathlib import Path

C = bpy.context
D = bpy.data

USE_TEMP_IMAGE_DIR = True
DIR = "../kode/src/resources/objects/"

DIR = os.path.join(bpy.path.abspath("//"), DIR)
DIR = os.path.normpath(DIR)

MATERIALS_DATA_PATH = os.path.join(DIR, 'objects-materials-simple.js')

IMAGE_COLLECT_DIR_PATH = os.path.join(DIR, 'material_resources')

if USE_TEMP_IMAGE_DIR:
    IMAGE_COLLECT_DIR_PATH = os.path.join(DIR, 'material_resources/temp')
    Path(IMAGE_COLLECT_DIR_PATH).mkdir(exist_ok=True)

default_material = {
      "name": "Default",
      "ambient": [1.0, 0.0, 1.0, 1.0],
      "diffuse": [1.0, 0.8, 0.0, 1.0],
      "specular": [1.0, 0.8, 0.0, 1.0],
      "shininess": 20,
    }


materials = [default_material]

for material in D.materials:
    material_data = {}
    material_data['name'] = material.name
    nodes = material.node_tree.nodes
    
    type = None
    
    if 'Principled BSDF' in nodes:
        type = 'Principled BSDF'
    elif 'Emission' in nodes:
        type = 'Emission'
    
    if type is None:
        continue
    
    node = material.node_tree.nodes[type]
    color_strkey = 'Base Color'
    
    if type == 'Emission':
        color_strkey = 'Color'
    
    color_socket = node.inputs[color_strkey]
    color_values = color_socket.default_value
    material_color = [color_values[0], color_values[1], color_values[2], color_values[3]]
    
    material_data['color'] = material_color
    
    if type == 'Principled BSDF':        
        material_data['ambient'] = material_color
        material_data['diffuse'] = material_color
        material_data['specular'] = material_color
        
        # This is some rough experimentation of converting roughness to specular
        material_data['shininess'] = 2 ** ((1 - node.inputs['Roughness'].default_value) * 6)
        material_data['shininess'] *= 10
        
    elif type == 'Emission':
        material_data['emissive'] = True
    
    # Find color socket that's connected to this BSDF node
    # Then, accept only image shader
    color_links = color_socket.links
    image_node = None
    
    for link in color_socket.links:
        if link.to_node == node:
            from_node = link.from_node
            if isinstance(from_node, bpy.types.ShaderNodeTexImage):
                image_node = from_node
                break
    
    if image_node is not None and image_node.image is not None:
        image = image_node.image
        image_path = os.path.normpath(image_node.image.filepath_from_user())
        image_is_written = False
        
        # Assume filenames are unique
        fname = os.path.split(image_path)[1]
        target_path = os.path.join(IMAGE_COLLECT_DIR_PATH, fname)
            
        # Check whether the image is a packed file
        packed_file = image.packed_file
        
        # If it is, copy all of its bytes data
        if packed_file:
            material_id = str(uuid.uuid1()).split('-')[0]
            format = image.file_format.lower()
            fname = material.name + '.' + material_id + '.' + format
            
            target_path = os.path.join(IMAGE_COLLECT_DIR_PATH, fname)
            
            with open(target_path, mode='wb') as outfile:
                outfile.write(packed_file.data)
            image_is_written = True
        else:
            # Check if path exists
            if os.path.exists(image_path) and image_path != target_path:
                shutil.copy(image_path, target_path)
                image_is_written = True
        
        if image_is_written:
            fpath = fname
            if USE_TEMP_IMAGE_DIR:
                fpath = 'temp/' + fname
            material_data['image'] = fpath
    
    materials.append(material_data)
    

with open(MATERIALS_DATA_PATH, "w+") as outfile:
    outfile.write("materials_definition = materials_definition.concat(" + json.dumps(materials, indent=2) + ")")

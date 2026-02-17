"""
Smart image validation using AI to detect if image is blood cell related
"""
from PIL import Image
import io
import numpy as np
import torch
import torchvision.transforms as transforms
from fastapi import HTTPException
from logger import logger

class SmartImageValidator:
    """Validates if uploaded image is a blood cell image"""
    
    def __init__(self, model=None):
        self.model = model
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
    
    def validate_blood_cell_image(self, image_bytes: bytes, filename: str) -> dict:
        """
        Comprehensive validation to check if image is a blood cell image
        Returns: dict with validation results
        """
        try:
            # Open image
            image = Image.open(io.BytesIO(image_bytes))
            
            # 1. Check image format
            if image.format not in ['PNG', 'JPEG', 'JPG']:
                raise HTTPException(
                    status_code=400,
                    detail="❌ Invalid format. Only PNG and JPEG images are accepted."
                )
            
            # 2. Check image size
            width, height = image.size
            
            if width < 50 or height < 50:
                raise HTTPException(
                    status_code=400,
                    detail="❌ Image too small. Blood cell images should be at least 50x50 pixels."
                )
            
            if width > 5000 or height > 5000:
                raise HTTPException(
                    status_code=400,
                    detail="❌ Image too large. Please upload a microscopic blood cell image (max 5000x5000)."
                )
            
            # 3. Convert to RGB
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # 4. Check image characteristics
            img_array = np.array(image)
            
            # Check mean intensity (blood cell images have specific brightness)
            mean_intensity = np.mean(img_array)
            if mean_intensity < 20:
                raise HTTPException(
                    status_code=400,
                    detail="❌ Image too dark. This doesn't look like a blood cell microscopy image."
                )
            if mean_intensity > 240:
                raise HTTPException(
                    status_code=400,
                    detail="❌ Image too bright. This doesn't look like a blood cell microscopy image."
                )
            
            # Check variance (blood cell images have detail)
            variance = np.var(img_array)
            if variance < 200:
                raise HTTPException(
                    status_code=400,
                    detail="❌ Image lacks detail. Please upload a clear blood cell microscopy image."
                )
            
            # 5. Check color distribution (blood cells have specific colors)
            # Blood cell images typically have pinkish/purple tones
            r_mean = np.mean(img_array[:, :, 0])
            g_mean = np.mean(img_array[:, :, 1])
            b_mean = np.mean(img_array[:, :, 2])
            
            # Check if image has reasonable color distribution
            color_std = np.std([r_mean, g_mean, b_mean])
            if color_std < 5:
                raise HTTPException(
                    status_code=400,
                    detail="❌ Image appears to be grayscale or lacks color variation. Blood cell images should have color."
                )
            
            # 6. Check image complexity (edges, textures)
            # Blood cells have specific texture patterns
            gray = np.mean(img_array, axis=2)
            edges = np.abs(np.diff(gray, axis=0)).sum() + np.abs(np.diff(gray, axis=1)).sum()
            edge_density = edges / (width * height)
            
            if edge_density < 5:
                raise HTTPException(
                    status_code=400,
                    detail="❌ Image too simple. This doesn't appear to be a microscopy image."
                )
            
            # 7. AI-based validation (if model is available)
            if self.model is not None:
                confidence_score = self._check_with_model(image)
                
                # If model confidence is very low, image might not be blood cell
                if confidence_score < 0.3:
                    raise HTTPException(
                        status_code=400,
                        detail="❌ This image doesn't appear to be a blood cell microscopy image. Please upload a proper blood cell image from the dataset."
                    )
            
            # 8. Check aspect ratio (blood cell images are usually square-ish)
            aspect_ratio = max(width, height) / min(width, height)
            if aspect_ratio > 3:
                raise HTTPException(
                    status_code=400,
                    detail="❌ Unusual aspect ratio. Blood cell images are typically more square-shaped."
                )
            
            logger.info(f"✓ Image validation passed: {filename} ({width}x{height}, "
                       f"mean={mean_intensity:.1f}, var={variance:.1f}, edge_density={edge_density:.1f})")
            
            return {
                "valid": True,
                "width": width,
                "height": height,
                "mean_intensity": float(mean_intensity),
                "variance": float(variance),
                "edge_density": float(edge_density)
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Image validation error: {e}")
            raise HTTPException(
                status_code=400,
                detail=f"❌ Invalid image file: {str(e)}"
            )
    
    def _check_with_model(self, image: Image.Image) -> float:
        """
        Use the trained model to check if image is similar to training data
        Returns confidence score (0-1)
        """
        try:
            if self.model is None:
                return 1.0
            
            # Prepare image
            img_tensor = self.transform(image).unsqueeze(0)
            
            # Get model prediction
            self.model.eval()
            with torch.no_grad():
                outputs = self.model(img_tensor)
                probabilities = torch.nn.functional.softmax(outputs, dim=1)
                max_prob = torch.max(probabilities).item()
            
            return max_prob
            
        except Exception as e:
            logger.warning(f"Model validation check failed: {e}")
            return 1.0  # If check fails, allow image through

def validate_blood_cell_image_simple(image_bytes: bytes, filename: str) -> bool:
    """
    Simple validation without model
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        
        # Basic checks
        if image.format not in ['PNG', 'JPEG', 'JPG']:
            raise HTTPException(
                status_code=400,
                detail="❌ Invalid format. Only PNG and JPEG are supported."
            )
        
        width, height = image.size
        
        if width < 50 or height < 50:
            raise HTTPException(
                status_code=400,
                detail="❌ Image too small (minimum 50x50 pixels)."
            )
        
        if width > 5000 or height > 5000:
            raise HTTPException(
                status_code=400,
                detail="❌ Image too large (maximum 5000x5000 pixels)."
            )
        
        # Convert to RGB
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        img_array = np.array(image)
        
        # Check brightness
        mean_intensity = np.mean(img_array)
        if mean_intensity < 20 or mean_intensity > 240:
            raise HTTPException(
                status_code=400,
                detail="❌ Image brightness is unusual for blood cell microscopy."
            )
        
        # Check detail
        variance = np.var(img_array)
        if variance < 200:
            raise HTTPException(
                status_code=400,
                detail="❌ Image lacks sufficient detail for analysis."
            )
        
        # Check if it's not a screenshot or graphic
        # Screenshots usually have very uniform regions
        std_per_channel = [np.std(img_array[:, :, i]) for i in range(3)]
        if max(std_per_channel) < 10:
            raise HTTPException(
                status_code=400,
                detail="❌ Image appears to be a graphic or screenshot, not a microscopy image."
            )
        
        logger.info(f"✓ Image validated: {filename} ({width}x{height})")
        return True
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=400,
            detail=f"❌ Image validation failed: {str(e)}"
        )

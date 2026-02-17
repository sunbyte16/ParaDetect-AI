"""
Improved malaria detection model training
Trains on cell_images dataset with better accuracy
"""
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset, random_split
from torchvision import transforms, models
from PIL import Image
import os
from pathlib import Path
import time
from datetime import datetime
import numpy as np

class MalariaDataset(Dataset):
    """Custom dataset for malaria cell images"""
    
    def __init__(self, root_dir, transform=None):
        self.root_dir = Path(root_dir)
        self.transform = transform
        self.classes = ['Parasitized', 'Uninfected']
        self.images = []
        self.labels = []
        
        print(f"Loading dataset from: {root_dir}")
        
        # Load all images
        for idx, class_name in enumerate(self.classes):
            class_dir = self.root_dir / class_name
            if not class_dir.exists():
                print(f"Warning: {class_dir} does not exist!")
                continue
            
            image_files = list(class_dir.glob('*.png'))
            print(f"Loading {class_name}: {len(image_files)} images")
            
            for img_path in image_files:
                self.images.append(str(img_path))
                self.labels.append(idx)
        
        print(f"\nTotal images loaded: {len(self.images)}")
        print(f"  Parasitized: {self.labels.count(0)}")
        print(f"  Uninfected: {self.labels.count(1)}")
    
    def __len__(self):
        return len(self.images)
    
    def __getitem__(self, idx):
        img_path = self.images[idx]
        label = self.labels[idx]
        
        try:
            image = Image.open(img_path).convert('RGB')
            
            if self.transform:
                image = self.transform(image)
            
            return image, label
        except Exception as e:
            print(f"Error loading {img_path}: {e}")
            # Return a blank image if error
            return torch.zeros(3, 224, 224), label

def train_model(data_dir='../cell_images', epochs=15, batch_size=64, learning_rate=0.001):
    """Train the malaria detection model"""
    
    print("\n" + "="*80)
    print("MALARIA DETECTION MODEL TRAINING - IMPROVED VERSION")
    print("="*80)
    print(f"Dataset: {data_dir}")
    print(f"Epochs: {epochs}")
    print(f"Batch Size: {batch_size}")
    print(f"Learning Rate: {learning_rate}")
    print("="*80 + "\n")
    
    # Check if dataset exists
    if not os.path.exists(data_dir):
        print(f"\n❌ Error: Dataset directory '{data_dir}' not found!")
        print("\nTrying alternative path...")
        data_dir = 'cell_images'
        if not os.path.exists(data_dir):
            print(f"❌ Error: Dataset directory '{data_dir}' not found!")
            print("\nExpected structure:")
            print("cell_images/")
            print("  ├── Parasitized/")
            print("  └── Uninfected/")
            return None, 0
    
    # Device configuration
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"🖥️  Using device: {device}")
    if device.type == 'cuda':
        print(f"   GPU: {torch.cuda.get_device_name(0)}")
    print()
    
    # Data transforms with augmentation
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.5),
        transforms.RandomRotation(20),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    
    # Load dataset
    print("📂 Loading dataset...")
    full_dataset = MalariaDataset(data_dir, transform=train_transform)
    
    if len(full_dataset) == 0:
        print("❌ No images found in dataset!")
        return None, 0
    
    # Split dataset (80% train, 20% validation)
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(
        full_dataset, [train_size, val_size],
        generator=torch.Generator().manual_seed(42)
    )
    
    # Update validation dataset transform
    val_dataset.dataset.transform = val_transform
    
    print(f"\n✓ Training samples: {train_size}")
    print(f"✓ Validation samples: {val_size}")
    
    # Data loaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=0,
        pin_memory=True if device.type == 'cuda' else False
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=0,
        pin_memory=True if device.type == 'cuda' else False
    )
    
    # Load pre-trained ResNet18 model
    print("\n🧠 Loading ResNet18 model...")
    model = models.resnet18(pretrained=True)
    
    # Freeze early layers
    for param in list(model.parameters())[:-10]:
        param.requires_grad = False
    
    # Modify final layer for binary classification
    num_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.5),
        nn.Linear(num_features, 2)
    )
    
    model = model.to(device)
    print("✓ Model loaded and configured")
    
    # Loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=learning_rate)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='max', factor=0.5, patience=2
    )
    
    # Training loop
    print("\n🚀 Starting training...")
    print("="*80 + "\n")
    
    best_val_acc = 0.0
    best_model_path = None
    
    for epoch in range(epochs):
        start_time = time.time()
        
        # Training phase
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0
        
        print(f"Epoch [{epoch+1}/{epochs}]")
        
        for batch_idx, (images, labels) in enumerate(train_loader):
            images = images.to(device)
            labels = labels.to(device)
            
            # Forward pass
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            # Backward pass
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            
            # Statistics
            train_loss += loss.item()
            _, predicted = torch.max(outputs.data, 1)
            train_total += labels.size(0)
            train_correct += (predicted == labels).sum().item()
            
            # Print progress every 50 batches
            if (batch_idx + 1) % 50 == 0:
                current_acc = 100 * train_correct / train_total
                print(f"  Batch [{batch_idx+1}/{len(train_loader)}] "
                      f"Loss: {loss.item():.4f} | Acc: {current_acc:.2f}%")
        
        train_acc = 100 * train_correct / train_total
        avg_train_loss = train_loss / len(train_loader)
        
        # Validation phase
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for images, labels in val_loader:
                images = images.to(device)
                labels = labels.to(device)
                
                outputs = model(images)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                val_total += labels.size(0)
                val_correct += (predicted == labels).sum().item()
        
        val_acc = 100 * val_correct / val_total
        avg_val_loss = val_loss / len(val_loader)
        
        # Learning rate scheduling
        scheduler.step(val_acc)
        
        # Print epoch results
        epoch_time = time.time() - start_time
        print(f"\n{'='*80}")
        print(f"Epoch [{epoch+1}/{epochs}] Summary - Time: {epoch_time:.2f}s")
        print(f"Train Loss: {avg_train_loss:.4f} | Train Acc: {train_acc:.2f}%")
        print(f"Val Loss: {avg_val_loss:.4f} | Val Acc: {val_acc:.2f}%")
        print(f"{'='*80}\n")
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            best_model_path = f"models/malaria_model_acc{val_acc:.2f}_{timestamp}.pth"
            
            os.makedirs("models", exist_ok=True)
            torch.save(model.state_dict(), best_model_path)
            print(f"✓ Best model saved: {best_model_path}\n")
    
    print("\n" + "="*80)
    print("TRAINING COMPLETED!")
    print("="*80)
    print(f"Best Validation Accuracy: {best_val_acc:.2f}%")
    print(f"Best Model: {best_model_path}")
    print("="*80)
    
    # Save final model as malaria_model.pth
    final_model_path = "models/malaria_model.pth"
    
    # Load best model and save as final
    if best_model_path and os.path.exists(best_model_path):
        model.load_state_dict(torch.load(best_model_path))
    
    torch.save(model.state_dict(), final_model_path)
    print(f"\n✓ Final model saved: {final_model_path}")
    print(f"✓ This model will be used by the application")
    
    return model, best_val_acc

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Train Improved Malaria Detection Model')
    parser.add_argument('--data_dir', type=str, default='../cell_images',
                        help='Path to dataset directory')
    parser.add_argument('--epochs', type=int, default=15,
                        help='Number of training epochs')
    parser.add_argument('--batch_size', type=int, default=64,
                        help='Batch size for training')
    parser.add_argument('--lr', type=float, default=0.001,
                        help='Learning rate')
    
    args = parser.parse_args()
    
    print("\n🔬 ParaDetect AI - Model Training")
    print("Training on cell_images dataset...")
    print()
    
    model, accuracy = train_model(
        data_dir=args.data_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr
    )
    
    if model and accuracy > 0:
        print("\n" + "="*80)
        print("✅ MODEL TRAINING SUCCESSFUL!")
        print("="*80)
        print(f"Final Accuracy: {accuracy:.2f}%")
        print(f"Model Location: backend/models/malaria_model.pth")
        print("\nThe application will now use this trained model.")
        print("Restart the backend to load the new model.")
        print("="*80 + "\n")
    else:
        print("\n❌ Training failed. Please check the error messages above.")

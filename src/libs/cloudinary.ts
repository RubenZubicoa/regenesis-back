import cloudinary from 'cloudinary';

export async function uploadToCloudinary(file: Express.Multer.File) {

    // Configuration
    cloudinary.v2.config({ 
        cloud_name: process.env.CLOUDINARY_NAME, 
        api_key: process.env.CLOUDINARY_KEY, 
        api_secret: process.env.CLOUDINARY_SECRET // Click 'View API Keys' above to copy your API secret
    });
    
    // Upload an image
     const uploadResult = await cloudinary.v2.uploader
       .upload(
           file.path, {
               public_id: file.filename,
           }
       )
       .catch((error) => {
           console.log(error);
       });
    
    return uploadResult?.secure_url;
}
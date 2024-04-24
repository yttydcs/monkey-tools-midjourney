import axios from 'axios';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export async function downloadImageAsJson(url: string) {
  const { data } = await axios.get(url, {
    responseType: 'json',
  });
  return data;
}

export async function downloadImageAsBase64(url: string) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    const imageBuffer = Buffer.from(response.data, 'binary');
    const base64String = imageBuffer.toString('base64');

    return base64String;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

export async function downloadFileAsBuffer(url: string) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    const imageBuffer = Buffer.from(response.data, 'binary');
    return imageBuffer;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

export async function downloadFileTo(url: string, path: string) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });
    const imageBuffer = Buffer.from(response.data, 'binary');
    fs.writeFileSync(path, imageBuffer);
  } catch (error) {
    console.error('Error save image:', error);
    throw error;
  }
}

export function base64ToBuffer(base64String: string) {
  const base64WithoutPrefix = base64String.replace(
    /^data:image\/\w+;base64,/,
    '',
  );
  const buffer = Buffer.from(base64WithoutPrefix, 'base64');
  return buffer;
}

export async function splitImage(imagePath: string, folder: string) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
  // 获取原始图片的尺寸
  const metadata = await sharp(imagePath).metadata();
  const width = metadata.width;
  const height = metadata.height;

  // 计算新的尺寸
  const newWidth = width! / 2;
  const newHeight = height! / 2;

  const files = [];
  // 切分图片
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const fileName = path.join(folder, `output_${i}_${j}.jpg`);
      await sharp(imagePath)
        .extract({
          left: i * newWidth,
          top: j * newHeight,
          width: newWidth,
          height: newHeight,
        })
        .toFile(fileName);
      files.push(fileName);
    }
  }
  console.log('图片切分完成');
  return files;
}

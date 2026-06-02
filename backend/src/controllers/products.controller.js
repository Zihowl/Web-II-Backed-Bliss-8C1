const {
  findAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../models/product.model');

const getProducts = async (req, res, next) => {
  try {
    const products = await findAllProducts();
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// Valida los campos obligatorios del alta/edicion de producto (RNF-08).
const validateProduct = (body) => {
  const { name, price, imageUrl, category, description } = body;
  if (!name || !category || !description || imageUrl === undefined || imageUrl === null || imageUrl === '') {
    return 'Nombre, imagen, categoría y descripción son obligatorios';
  }
  if (price === undefined || price === null || Number(price) <= 0) {
    return 'El precio debe ser un número mayor a 0';
  }
  return null;
};

const addProduct = async (req, res, next) => {
  try {
    const error = validateProduct(req.body);
    if (error) {
      return res.status(400).json({ mensaje: error });
    }
    const product = await createProduct(req.body);
    res.status(201).json({ mensaje: 'Producto creado', product });
  } catch (err) {
    next(err);
  }
};

const editProduct = async (req, res, next) => {
  try {
    const error = validateProduct(req.body);
    if (error) {
      return res.status(400).json({ mensaje: error });
    }
    const product = await updateProduct(Number(req.params.id), req.body);
    if (!product) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    res.json({ mensaje: 'Producto actualizado', product });
  } catch (err) {
    next(err);
  }
};

// Subida de imagen de producto (RNF-08). Devuelve la URL publica del archivo.
const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ mensaje: 'No se recibio ninguna imagen' });
  }
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
  res.status(201).json({ imageUrl });
};

const removeProduct = async (req, res, next) => {
  try {
    const product = await deleteProduct(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    res.json({ mensaje: 'Producto eliminado' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  addProduct,
  editProduct,
  removeProduct,
  uploadImage,
};

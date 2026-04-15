require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const result = await mongoose.connection.collection('notes').updateMany(
    { authorId: 'b26fcb98-6b5e-4ca8-ba6a-aa89632cf789' },
    { $set: { authorId: '69dcce7700f12b58f492d847' } }
  );
  console.log('Notas actualizadas:', result.modifiedCount);
  await mongoose.disconnect();
});
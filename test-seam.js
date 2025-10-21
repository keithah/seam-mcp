import { Seam } from 'seam';
import dotenv from 'dotenv';

dotenv.config();

async function testSeam() {
  console.log('Testing Seam API...');
  console.log('API Key:', process.env.SEAM_API_KEY ? 'Set' : 'Not set');

  try {
    const seam = new Seam(process.env.SEAM_API_KEY);
    console.log('✓ Seam client created');

    console.log('\nFetching locks...');
    const locks = await seam.locks.list();
    console.log(`✓ Found ${locks.length} locks`);

    if (locks.length > 0) {
      console.log('\nFirst lock details:');
      console.log(JSON.stringify(locks[0], null, 2));
    }

    console.log('\n✓ Test completed successfully!');
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSeam();

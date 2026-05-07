(async () => {
  try {
    const m = await import('../src/utils/crypto.js');
    console.log('exports:', Object.keys(m));
  } catch (e) {
    console.error('error importing crypto:', e);
    process.exit(1);
  }
})();

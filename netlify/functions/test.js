// باسم الله الرحمن الرحيم
// دالة بسيطة للتأكد من أن Handler مصدّر بشكل صحيح

// تصدير دالة Handler بشكل مباشر
exports.handler = async (event, context) => {
  console.log('تم استدعاء دالة test بنجاح');
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      message: 'دالة اختبار تعمل بنجاح!',
      timestamp: new Date().toISOString(),
      event_path: event.path,
      event_method: event.httpMethod
    })
  };
};

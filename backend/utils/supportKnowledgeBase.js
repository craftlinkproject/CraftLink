const hasArabic = (text) => /[\u0600-\u06FF]/.test(text);

const faqs = [
  // ── Platform Overview ──
  {
    id: "welcome",
    intents: ["greeting", "welcome", "hello", "hi", "start", "help", "what is craftlink"],
    keywords: { en: ["craftlink", "platform", "what is", "about", "website"], ar: ["كرافت لينك", "المنصة", "ما هي", "عن", "الموقع"] },
    getAnswer: (lang) => lang === "ar"
      ? "مرحباً بك في كرافت لينك! 🎉\n\nكرافت لينك هي منصة تربط الحرفيين والعملاء والمتعلمين. يمكنك:\n• اكتشاف حرفيين موثوقين في مجالك\n• الالتحاق بدورات تدريبية احترافية\n• عرض وبيع مهاراتك وحرفتك\n• التواصل مع محترفين في مجالك\n\nكيف يمكنني مساعدتك اليوم؟"
      : "Welcome to CraftLink! 🎉\n\nCraftLink is a platform connecting skilled craftsmen with customers and learners. You can:\n• Discover trusted craftsmen in your field\n• Enroll in professional training courses\n• Showcase and sell your skills\n• Connect with professionals in your trade\n\nHow can I help you today?",
  },
  {
    id: "features",
    intents: ["features", "what can i do", "capabilities"],
    keywords: { en: ["feature", "capability", "what can", "do on", "offer"], ar: ["ميزات", "إمكانيات", "ماذا يمكن", "الخدمات", "نقدم"] },
    getAnswer: (lang) => lang === "ar"
      ? "✨ ميزات كرافت لينك:\n\n📚 **دورات تعليمية**: تصفح واشترك في دورات في مجالات الحرف والصناعات المختلفة\n🔍 **بحث ذكي**: ابحث عن دورات وحرفيين بالعربية أو الإنجليزية\n💬 **رسائل فورية**: تواصل بشكل آمن ومشفر مع الحرفيين\n📝 **تقييمات**: اقرأ تقييمات الحرفيين والدورات\n📜 **شهادات**: احصل على شهادة عند إتمام الدورة\n💰 **أرباح**: اربح من خلال بيع دوراتك\n📱 **منشورات**: شارك أعمالك وتواصل مع المجتمع"
      : "✨ CraftLink Features:\n\n📚 **Training Courses**: Browse and enroll in courses across various trades\n🔍 **Smart Search**: Search courses and craftsmen in Arabic or English\n💬 **Instant Messaging**: Securely communicate with craftsmen\n📝 **Reviews**: Read reviews for courses and craftsmen\n📜 **Certificates**: Earn a certificate upon course completion\n💰 **Earnings**: Make money by selling your courses\n📱 **Posts**: Share your work and engage with the community",
  },

  // ── Account & Auth ──
  {
    id: "signup",
    intents: ["signup", "register", "create account", "join"],
    keywords: { en: ["sign up", "register", "create account", "join", "new account"], ar: ["اشتراك", "تسجيل", "إنشاء حساب", "انضم", "حساب جديد"] },
    getAnswer: (lang) => lang === "ar"
      ? "لإنشاء حساب جديد في كرافت لينك:\n\n1️⃣ اذهب إلى صفحة 'انضم' أو 'تسجيل'\n2️⃣ أدخل اسمك وبريدك الإلكتروني وكلمة المرور\n3️⃣ اختر دورك (حرفي، مدرب، عميل)\n4️⃣ اضغط على 'تسجيل'\n\nأو يمكنك التسجيل باستخدام حساب Google بضغطة واحدة! 🚀\n\nبعد التسجيل، يمكنك تصفح الدورات والتواصل مع الحرفيين."
      : "To create a new account on CraftLink:\n\n1️⃣ Go to the 'Join' or 'Sign Up' page\n2️⃣ Enter your name, email, and password\n3️⃣ Choose your role (Craftsman, Instructor, Client)\n4️⃣ Click 'Sign Up'\n\nOr sign up with Google in one click! 🚀\n\nAfter signing up, you can browse courses and connect with craftsmen.",
  },
  {
    id: "login",
    intents: ["login", "signin", "sign in", "log in"],
    keywords: { en: ["login", "sign in", "log in", "signin"], ar: ["تسجيل دخول", "دخول", "تسجيل الدخول"] },
    getAnswer: (lang) => lang === "ar"
      ? "لتسجيل الدخول إلى حسابك:\n\n1️⃣ اذهب إلى صفحة 'تسجيل الدخول'\n2️⃣ أدخل بريدك الإلكتروني وكلمة المرور\n3️⃣ اضغط على 'دخول'\n\nأو يمكنك تسجيل الدخول باستخدام Google! ✅\n\nإذا نسيت كلمة المرور، يمكنك إعادة تعيينها من صفحة تسجيل الدخول."
      : "To log in to your account:\n\n1️⃣ Go to the 'Sign In' page\n2️⃣ Enter your email and password\n3️⃣ Click 'Sign In'\n\nOr log in with Google! ✅\n\nIf you forgot your password, you can reset it from the login page.",
  },
  {
    id: "roles",
    intents: ["roles", "user types", "account types", "craftsman", "instructor", "client"],
    keywords: { en: ["role", "user type", "craftsman", "instructor", "client", "account type"], ar: ["دور", "نوع المستخدم", "حرفي", "مدرب", "عميل", "نوع الحساب"] },
    getAnswer: (lang) => lang === "ar"
      ? "أنواع المستخدمين في كرافت لينك:\n\n👨‍🔧 **حرفي (Craftsman)**: يمكنه عرض مهاراته والتواصل مع العملاء\n👨‍🏫 **مدرب (Instructor)**: يمكنه إنشاء وبيع الدورات التدريبية\n👤 **عميل (Client)**: يمكنه تصفح وشراء الدورات والتواصل مع الحرفيين\n🛡️ **مشرف (Admin)**: يدير المنصة\n\nيمكنك اختيار دورك أثناء التسجيل."
      : "User roles on CraftLink:\n\n👨‍🔧 **Craftsman**: Showcase skills and connect with clients\n👨‍🏫 **Instructor**: Create and sell training courses\n👤 **Client**: Browse and purchase courses, connect with craftsmen\n🛡️ **Admin**: Manage the platform\n\nYou can choose your role during signup.",
  },
  {
    id: "reset-password",
    intents: ["reset password", "forgot password", "change password"],
    keywords: { en: ["reset password", "forgot password", "change password", "lost password"], ar: ["إعادة تعيين", "نسيت كلمة", "تغيير كلمة", "استعادة كلمة"] },
    getAnswer: (lang) => lang === "ar"
      ? "لإعادة تعيين كلمة المرور:\n\n1️⃣ اذهب إلى صفحة 'تسجيل الدخول'\n2️⃣ اضغط على 'نسيت كلمة المرور'\n3️⃣ أدخل بريدك الإلكتروني\n4️⃣ ستتلقى رمز تحقق عبر البريد الإلكتروني\n5️⃣ أدخل الرمز وكلمة المرور الجديدة\n\n✅ تم! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.\n\nملاحظة: رمز التحقق صالح لمدة 10 دقائق فقط."
      : "To reset your password:\n\n1️⃣ Go to the 'Sign In' page\n2️⃣ Click 'Forgot Password'\n3️⃣ Enter your email address\n4️⃣ You'll receive a verification code via email\n5️⃣ Enter the code and your new password\n\n✅ Done! You can now log in with your new password.\n\nNote: The verification code is valid for 10 minutes only.",
  },
  {
    id: "logout",
    intents: ["logout", "sign out", "log out"],
    keywords: { en: ["logout", "sign out", "log out"], ar: ["تسجيل خروج", "خروج"] },
    getAnswer: (lang) => lang === "ar"
      ? "لتسجيل الخروج، ببساطة اضغط على خيار 'تسجيل الخروج' من قائمة الملف الشخصي."
      : "To log out, simply click the 'Log Out' option from your profile menu.",
  },

  // ── Courses ──
  {
    id: "browse-courses",
    intents: ["browse courses", "find courses", "search courses", "courses"],
    keywords: { en: ["course", "courses", "browse", "find course", "search course", "all courses"], ar: ["دورات", "دورة", "تصفح", "البحث عن", "جميع الدورات"] },
    getAnswer: (lang) => lang === "ar"
      ? "لتصفح الدورات المتاحة:\n\n🔍 استخدم شريط البحث في أعلى الصفحة\n📂 تصفح الفئات مثل النجارة والسباكة والكهرباء\n🏠 من الصفحة الرئيسية، يمكنك رؤية الدورات الأكثر شهرة\n\nالبحث يدعم العربية والإنجليزية! اكتب أي مصطلح وستجد النتائج."
      : "To browse available courses:\n\n🔍 Use the search bar at the top of the page\n📂 Browse categories like Carpentry, Plumbing, Electricity\n🏠 From the homepage, you can see popular courses\n\nSearch supports both Arabic and English! Type any term and find results.",
  },
  {
    id: "course-levels",
    intents: ["course levels", "difficulty", "beginner", "advanced", "intermediate"],
    keywords: { en: ["beginner", "intermediate", "advanced", "level", "difficulty"], ar: ["مبتدئ", "متوسط", "متقدم", "مستوى", "صعوبة"] },
    getAnswer: (lang) => lang === "ar"
      ? "مستويات الدورات في كرافت لينك:\n\n🌟 **مبتدئ (Beginner)**: للمبتدئين، لا يحتاج خبرة سابقة\n🌟 **متوسط (Intermediate)**: لمن لديهم بعض المعرفة\n🌟 **متقدم (Advanced)**: للخبراء والمحترفين\n\nيمكنك تصفية النتائج حسب المستوى أثناء البحث!"
      : "Course levels on CraftLink:\n\n🌟 **Beginner**: For newcomers, no prior experience needed\n🌟 **Intermediate**: For those with some knowledge\n🌟 **Advanced**: For experts and professionals\n\nYou can filter results by level while searching!",
  },
  {
    id: "course-categories",
    intents: ["categories", "trades", "skills available", "what trades"],
    keywords: { en: ["category", "categories", "trade", "skill", "carpentry", "plumbing", "electricity", "painting", "welding", "mechanics", "crafts"], ar: ["فئة", "فئات", "مهنة", "مهارة", "نجارة", "سباكة", "كهرباء", "دهان", "لحام", "ميكانيكا"] },
    getAnswer: (lang) => lang === "ar"
      ? "الفئات المتاحة في كرافت لينك:\n\n🔨 **البناء والإنشاء**: نجارة، بناء، سباكة، كهرباء، دهان، لحام\n🔧 **الميكانيكا والهندسة**: ميكانيكا، تكييف، إلكترونيات\n💻 **المجال الرقمي**: برمجة، تصميم، تسويق إلكتروني\n🍳 **الضيافة**: طبخ، حلويات، باريستا\n✂️ **الحرف اليدوية**: خياطة، تطريز، فخار\n🌿 **الزراعة**: زراعة، صيد، تربية حيوانات\n💈 **الخدمات**: حلاقة، تجميل، تنظيف\n🎨 **الإبداع**: تصوير، موسيقى، خط\nوغيرها الكثير!"
      : "Available categories on CraftLink:\n\n🔨 **Construction & Building**: Carpentry, Masonry, Plumbing, Electricity, Painting, Welding\n🔧 **Mechanics & Engineering**: Auto mechanics, HVAC, Electronics\n💻 **Digital & Creative**: Programming, Design, Digital Marketing\n🍳 **Hospitality**: Cooking, Pastry, Barista\n✂️ **Handicrafts**: Tailoring, Embroidery, Pottery\n🌿 **Agriculture**: Farming, Fishing, Animal Husbandry\n💈 **Services**: Barbering, Beauty, Cleaning\n🎨 **Creative**: Photography, Music, Calligraphy\nAnd many more!",
  },

  // ── Enrolling & Learning ──
  {
    id: "enroll",
    intents: ["enroll", "purchase", "buy course", "subscribe"],
    keywords: { en: ["enroll", "purchase", "buy", "subscribe", "register course", "sign up course"], ar: ["اشتراك", "شراء", "تسجيل في", "انضم للدورة"] },
    getAnswer: (lang) => lang === "ar"
      ? "للالتحاق بدورة:\n\n1️⃣ اذهب إلى صفحة الدورة\n2️⃣ اضغط على 'اشتراك' أو 'شراء'\n3️⃣ اختر طريقة الدفع\n4️⃣ أكمل عملية الدفع\n5️⃣ بعد الدفع، ستتمكن من الوصول إلى محتوى الدورة فوراً ✅\n\nيمكنك مشاهدة الدروس المسجلة في أي وقت ومن أي جهاز!"
      : "To enroll in a course:\n\n1️⃣ Go to the course page\n2️⃣ Click 'Enroll' or 'Buy'\n3️⃣ Choose your payment method\n4️⃣ Complete the payment process\n5️⃣ After payment, you'll get instant access to the course content ✅\n\nYou can watch recorded lectures anytime, from any device!",
  },
  {
    id: "payment-methods",
    intents: ["payment", "pay", "payment methods", "how to pay"],
    keywords: { en: ["payment", "pay", "credit card", "debit", "paymob", "checkout"], ar: ["دفع", "طرق الدفع", "بطاقة", "فيزا", "كريدت"] },
    getAnswer: (lang) => lang === "ar"
      ? "طرق الدفع المتاحة في كرافت لينك:\n\n💳 **بطاقات الائتمان**: فيزا، ماستركارد\n🏦 **التحويل البنكي**: عبر بايموب (Paymob)\n\nعملية الدفع آمنة ومشفرة بالكامل. سيتم إرسال إيصال الدفع إلى بريدك الإلكتروني."
      : "Available payment methods on CraftLink:\n\n💳 **Credit/Debit Cards**: Visa, Mastercard\n🏦 **Bank Transfer**: Via Paymob\n\nThe payment process is fully secure and encrypted. A payment receipt will be sent to your email.",
  },
  {
    id: "course-access",
    intents: ["access course", "my courses", "watch course", "learning"],
    keywords: { en: ["my courses", "my learning", "access", "watch", "play course", "dashboard"], ar: ["دوراتي", "مشاهدة", "تشغيل", "لوحة التحكم", "تعلم"] },
    getAnswer: (lang) => lang === "ar"
      ? "بعد شراء الدورة، يمكنك الوصول إليها من:\n\n1️⃣ **لوحة التحكم**: اذهب إلى 'الملف الشخصي' ← 'دوراتي'\n2️⃣ **صفحة الدورة**: يمكنك مشاهدة الدروس المسجلة\n3️⃣ **متابعة التقدم**: يتذكر النظام مكان توقفك تلقائياً\n\nسيتم حفظ تقدمك في الدورة حتى تتمكن من العودة وإكمالها في أي وقت!"
      : "After purchasing a course, you can access it from:\n\n1️⃣ **Dashboard**: Go to 'Profile' → 'My Courses'\n2️⃣ **Course Page**: Watch recorded lectures\n3️⃣ **Progress Tracking**: The system remembers where you left off automatically\n\nYour progress will be saved so you can come back and continue anytime!",
  },
  {
    id: "progress",
    intents: ["progress", "tracking", "continue course", "resume"],
    keywords: { en: ["progress", "track", "continue", "resume", "my progress"], ar: ["تقدم", "متابعة", "استمرار", "تقدمي"] },
    getAnswer: (lang) => lang === "ar"
      ? "📊 **تتبع التقدم**:\n\nعند مشاهدة الدروس، يتتبع النظام تقدمك تلقائياً. يمكنك:\n• رؤية الدروس المكتملة والمتبقية\n• استئناف المشاهدة من حيث توقفت\n• معرفة النسبة المئوية لإتمام الدورة\n\nتظهر معلومات التقدم في صفحة الدورة والملف الشخصي."
      : "📊 **Progress Tracking**:\n\nWhen watching lectures, the system automatically tracks your progress. You can:\n• See completed and remaining lectures\n• Resume watching from where you left off\n• View the completion percentage\n\nProgress information appears on the course page and your profile.",
  },
  {
    id: "reviews",
    intents: ["reviews", "ratings", "rate course", "feedback"],
    keywords: { en: ["review", "rating", "rate", "feedback", "comment course"], ar: ["تقييم", "مراجعة", "تقييمات", "تعليق"] },
    getAnswer: (lang) => lang === "ar"
      ? "⭐ **التقييمات والمراجعات**:\n\nبعد شراء الدورة، يمكنك تقييمها وكتابة مراجعة:\n1️⃣ اذهب إلى صفحة الدورة\n2️⃣ اختر عدد النجوم (1-5)\n3️⃣ اكتب تعليقك\n4️⃣ اضغط 'إرسال'\n\nتساعد التقييمات الآخرين في اختيار الدورات المناسبة!"
      : "⭐ **Reviews & Ratings**:\n\nAfter purchasing a course, you can rate it and write a review:\n1️⃣ Go to the course page\n2️⃣ Choose the star rating (1-5)\n3️⃣ Write your comment\n4️⃣ Click 'Submit'\n\nReviews help others choose the right courses!",
  },

  // ── Creating Courses (Instructor) ──
  {
    id: "become-instructor",
    intents: ["become instructor", "teach", "create course", "sell course"],
    keywords: { en: ["instructor", "teach", "create course", "sell course", "become teacher"], ar: ["مدرب", "تدريس", "إنشاء دورة", "بيع دورة"] },
    getAnswer: (lang) => lang === "ar"
      ? "لتصبح مدرباً في كرافت لينك:\n\n1️⃣ سجل حسابك كـ 'مدرب' (Instructor) أثناء التسجيل\n2️⃣ اذهب إلى 'إنشاء دورة' من القائمة\n3️⃣ أضف معلومات الدورة (العنوان، الوصف، الفئة، السعر)\n4️⃣ أضف الدروس (فيديو، وصف)\n5️⃣ انشر الدورة عندما تكون جاهزة\n\nبعد النشر، ستكون دورتك متاحة للطلاب للاشتراك وكسب الأرباح! 💰"
      : "To become an instructor on CraftLink:\n\n1️⃣ Register as an 'Instructor' during signup\n2️⃣ Go to 'Create Course' from the menu\n3️⃣ Add course details (title, description, category, price)\n4️⃣ Add lectures (video, description)\n5️⃣ Publish when ready\n\nOnce published, your course will be available for students to enroll and you'll earn revenue! 💰",
  },
  {
    id: "create-course-steps",
    intents: ["how to create course", "add lecture", "course creation"],
    keywords: { en: ["create course", "add lecture", "edit course", "publish course", "course details"], ar: ["إنشاء دورة", "إضافة درس", "تعديل دورة", "نشر دورة"] },
    getAnswer: (lang) => lang === "ar"
      ? "📝 **خطوات إنشاء دورة**:\n\n1️⃣ **المعلومات الأساسية**: العنوان، الفئة، المستوى، السعر\n2️⃣ **الوصف**: اشرح محتوى الدورة وما سيتعلمه الطالب\n3️⃣ **الصورة المصغرة**: أضف صورة جذابة للدورة\n4️⃣ **الدروس**: أضف فيديوهات الدروس مع الوصف\n5️⃣ **النشر**: بعد التأكد من كل شيء، انشر الدورة\n\n💡 يمكنك تعديل الدورة في أي وقت قبل النشر أو بعده."
      : "📝 **Course Creation Steps**:\n\n1️⃣ **Basic Info**: Title, category, level, price\n2️⃣ **Description**: Explain the course content and what students will learn\n3️⃣ **Thumbnail**: Add an attractive course image\n4️⃣ **Lectures**: Add video lectures with descriptions\n5️⃣ **Publish**: Once everything is ready, publish the course\n\n💡 You can edit your course anytime before or after publishing.",
  },
  {
    id: "earnings",
    intents: ["earnings", "revenue", "withdraw", "payout", "money"],
    keywords: { en: ["earn", "earning", "revenue", "withdraw", "payout", "money", "income", "balance"], ar: ["أرباح", "إيرادات", "سحب", "دفع", "رصيد", "دخل"] },
    getAnswer: (lang) => lang === "ar"
      ? "💰 **الأرباح والسحب للمدربين**:\n\n• يمكنك تتبع أرباحك من لوحة التحكم\n• يتم تجميع الأرباح من مبيعات دوراتك\n• يمكنك طلب سحب الأرباح بعد وصولها للحد الأدنى\n• يتم التحويل إلى حسابك البنكي\n\nاذهب إلى 'سحب الأرباح' من لوحة التحكم لطلب السحب.\n\nملاحظة: قد تستغرق عملية المعالجة بضع أيام عمل."
      : "💰 **Instructor Earnings & Withdrawals**:\n\n• Track your earnings from the dashboard\n• Earnings accumulate from your course sales\n• You can request a withdrawal once you reach the minimum threshold\n• Transfers are made to your bank account\n\nGo to 'Withdraw Earnings' from your dashboard to request a withdrawal.\n\nNote: Processing may take a few business days.",
  },

  // ── Certificates ──
  {
    id: "certificates",
    intents: ["certificate", "certification", "verify certificate"],
    keywords: { en: ["certificate", "certification", "verify certificate", "get certificate"], ar: ["شهادة", "شهادات", "التحقق من الشهادة", "الحصول على شهادة"] },
    getAnswer: (lang) => lang === "ar"
      ? "📜 **الشهادات**:\n\n**الحصول على شهادة**:\n• أكمل جميع دروس الدورة\n• اذهب إلى صفحة الدورة\n• اضغط على 'المطالبة بالشهادة'\n• سيتم إصدار شهادة فريدة لك\n\n**التحقق من الشهادة**:\n• اذهب إلى صفحة 'التحقق من الشهادة'\n• أدخل رمز الشهادة الفريد\n• سيتم عرض معلومات الشهادة\n\nكل شهادة لها رمز فريد يمكن مشاركته مع أصحاب العمل!"
      : "📜 **Certificates**:\n\n**Earning a Certificate**:\n• Complete all lectures in the course\n• Go to the course page\n• Click 'Claim Certificate'\n• A unique certificate will be issued to you\n\n**Verifying a Certificate**:\n• Go to the 'Verify Certificate' page\n• Enter the unique certificate code\n• The certificate information will be displayed\n\nEach certificate has a unique code you can share with employers!",
  },

  // ── Messaging ──
  {
    id: "messaging",
    intents: ["messaging", "chat", "message", "contact craftsman"],
    keywords: { en: ["message", "chat", "contact", "messaging", "talk to"], ar: ["رسالة", "محادثة", "تواصل", "رسائل", "التحدث مع"] },
    getAnswer: (lang) => lang === "ar"
      ? "💬 **نظام الرسائل**:\n\nيمكنك التواصل مع الحرفيين والمدربين من خلال:\n\n1️⃣ اذهب إلى صفحة الملف الشخصي للحرفي\n2️⃣ اضغط على 'إرسال رسالة'\n3️⃣ اكتب رسالتك وأرسلها\n\n**ميزات**:\n• تشفير من طرف إلى طرف 🔒\n• إرسال الصور 📷\n• إشعارات فورية 🔔\n• محادثات في الوقت الفعلي\n\nجميع الرسائل مشفرة وآمنة."
      : "💬 **Messaging System**:\n\nYou can communicate with craftsmen and instructors through:\n\n1️⃣ Go to the craftsman's profile page\n2️⃣ Click 'Send Message'\n3️⃣ Type your message and send\n\n**Features**:\n• End-to-end encryption 🔒\n• Image sharing 📷\n• Real-time notifications 🔔\n• Live conversations\n\nAll messages are encrypted and secure.",
  },

  // ── Posts & Timeline ──
  {
    id: "posts",
    intents: ["posts", "timeline", "social", "share"],
    keywords: { en: ["post", "timeline", "share", "social", "feed", "community"], ar: ["منشور", "منشورات", "مشاركة", "تواصل اجتماعي", "تغذية"] },
    getAnswer: (lang) => lang === "ar"
      ? "📱 **المنشورات والتايم لاين**:\n\nيمكنك مشاركة أعمالك وأفكارك مع المجتمع:\n\n**إنشاء منشور**:\n• اذهب إلى صفحة 'التايم لاين'\n• اكتب محتوى المنشور\n• أضف صوراً لأعمالك\n• انشر!\n\n**التفاعل**:\n• إعجاب 👍 وتعليق 💬 على المنشورات\n• متابعة الحرفيين الآخرين\n• بناء شبكة مهنية"
      : "📱 **Posts & Timeline**:\n\nShare your work and ideas with the community:\n\n**Creating a Post**:\n• Go to the 'Timeline' page\n• Write your post content\n• Add images of your work\n• Publish!\n\n**Engagement**:\n• Like 👍 and comment 💬 on posts\n• Follow other craftsmen\n• Build your professional network",
  },

  // ── Technical Support ──
  {
    id: "technical-issues",
    intents: ["technical", "bug", "error", "not working", "issue", "problem"],
    keywords: { en: ["error", "bug", "not working", "issue", "problem", "technical", "broken"], ar: ["خطأ", "مشكلة", "لا يعمل", "عطل", "تقني"] },
    getAnswer: (lang) => lang === "ar"
      ? "🔧 **إذا واجهت مشكلة تقنية**:\n\n1️⃣ **تحديث الصفحة**: جرب تحديث الصفحة أولاً\n2️⃣ **تسجيل الخروج/الدخول**: جرب تسجيل الخروج ثم الدخول مرة أخرى\n3️⃣ **مسح ذاكرة التخزين المؤقت**: امسح كاش المتصفح\n4️⃣ **جرب متصفحاً آخر**: قد يحل المشكلة\n\nإذا استمرت المشكلة، يرجى التواصل معنا عبر صفحة 'اتصل بنا' وسنحل المشكلة في أقرب وقت! 🙏"
      : "🔧 **If you're experiencing a technical issue**:\n\n1️⃣ **Refresh the page**: Try refreshing first\n2️⃣ **Log out/in**: Try logging out and back in\n3️⃣ **Clear cache**: Clear your browser cache\n4️⃣ **Try another browser**: This might resolve the issue\n\nIf the problem persists, please contact us via the 'Contact Us' page and we'll resolve it as soon as possible! 🙏",
  },
  {
    id: "contact-support",
    intents: ["contact", "support", "customer service", "help"],
    keywords: { en: ["contact", "support", "customer service", "help desk", "reach"], ar: ["اتصال", "دعم", "خدمة العملاء", "المساعدة"] },
    getAnswer: (lang) => lang === "ar"
      ? "📬 **طرق التواصل مع الدعم الفني**:\n\n📧 **البريد الإلكتروني**: support@craftlink.com\n💬 **صفحة اتصل بنا**: من القائمة، اختر 'اتصل بنا'\n\nنحن هنا لمساعدتك في أي وقت! 💪"
      : "📬 **Contact Support**:\n\n📧 **Email**: support@craftlink.com\n💬 **Contact Us page**: From the menu, select 'Contact Us'\n\nWe're here to help anytime! 💪",
  },

  // ── Privacy & Security ──
  {
    id: "privacy",
    intents: ["privacy", "data", "security", "encryption"],
    keywords: { en: ["privacy", "data", "security", "encryption", "private"], ar: ["خصوصية", "بيانات", "أمان", "تشفير", "خاص"] },
    getAnswer: (lang) => lang === "ar"
      ? "🔒 **الخصوصية والأمان في كرافت لينك**:\n\n• **تشفير الرسائل**: جميع الرسائل مشفرة من طرف إلى طرف (AES-256) 🔐\n• **حماية البيانات**: بياناتك محمية وفقاً لسياسة الخصوصية\n• **المدفوعات الآمنة**: جميع المدفوعات عبر بوابات دفع آمنة ومعتمدة\n• **التحكم في حسابك**: يمكنك إدارة بياناتك وإعدادات الخصوصية من ملفك الشخصي\n\nللمزيد من التفاصيل، اقرأ سياسة الخصوصية وشروط الاستخدام."
      : "🔒 **Privacy & Security on CraftLink**:\n\n• **Message Encryption**: All messages are end-to-end encrypted (AES-256) 🔐\n• **Data Protection**: Your data is protected according to our Privacy Policy\n• **Secure Payments**: All payments go through secure, verified payment gateways\n• **Account Control**: You can manage your data and privacy settings from your profile\n\nFor more details, read our Privacy Policy and Terms of Service.",
  },
];

const fallbackAnswer = (lang) => lang === "ar"
  ? "عذراً، لم أتمكن من فهم سؤالك بالكامل. 😅\n\nيمكنك تجربة أحد هذه المواضيع:\n• التسجيل وإنشاء الحساب\n• تصفح الدورات والاشتراك\n• إنشاء الدورات (للمدربين)\n• الشهادات والتحقق\n• الدفع والأرباح\n• الرسائل والتواصل\n• التواصل مع الدعم الفني\n\nأو اكتب 'مساعدة' لرؤية جميع الخيارات المتاحة!"
  : "Sorry, I couldn't fully understand your question. 😅\n\nYou can try one of these topics:\n• Registration & Account\n• Browsing & Enrolling in Courses\n• Creating Courses (for Instructors)\n• Certificates & Verification\n• Payments & Earnings\n• Messaging & Communication\n• Contact Support\n\nOr type 'help' to see all available options!";

const normalize = (text) => text.toLowerCase().replace(/[^\w\s\u0600-\u06FF]/g, " ").replace(/\s+/g, " ").trim();

const matchKeywords = (text, lang) => {
  const normalized = normalize(text);
  const isAr = lang === "ar" || hasArabic(text);

  const scored = faqs.map((faq) => {
    let score = 0;

    // Check intent matches
    for (const intent of faq.intents) {
      const intentNorm = normalize(intent);
      if (normalized.includes(intentNorm)) {
        score += 15;
      }
    }

    // Check keyword matches
    const keywords = isAr ? faq.keywords.ar : faq.keywords.en;
    for (const kw of keywords) {
      const kwNorm = normalize(kw);
      if (normalized.includes(kwNorm)) {
        score += 10;
      }
      // Partial match for longer keywords
      if (kwNorm.length >= 5 && normalized.includes(kwNorm.slice(0, 4))) {
        score += 3;
      }
    }

    // Word-level overlap
    const words = normalized.split(/\s+/);
    const kwWords = isAr
      ? new Set(faq.keywords.ar.map(normalize).flatMap((k) => k.split(/\s+/)))
      : new Set(faq.keywords.en.map(normalize).flatMap((k) => k.split(/\s+/)));
    const overlap = words.filter((w) => w.length >= 3 && kwWords.has(w)).length;
    score += overlap * 5;

    return { faq, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.filter((s) => s.score > 0);
};

export const getSupportResponse = (message, lang = "en") => {
  if (!message || message.trim().length < 2) {
    return { reply: fallbackAnswer(lang), faqId: null };
  }

  const matches = matchKeywords(message, lang);

  if (matches.length === 0) {
    return { reply: fallbackAnswer(lang), faqId: null };
  }

  const best = matches[0];
  return {
    reply: best.faq.getAnswer(lang),
    faqId: best.faq.id,
    confidence: best.score,
  };
};

export const getSuggestedQuestions = (lang = "en") => {
  const suggestions = [
    { id: "welcome", label: lang === "ar" ? "ما هي كرافت لينك؟" : "What is CraftLink?" },
    { id: "signup", label: lang === "ar" ? "كيفية إنشاء حساب" : "How to sign up" },
    { id: "browse-courses", label: lang === "ar" ? "البحث عن دورات" : "Find courses" },
    { id: "become-instructor", label: lang === "ar" ? "كيف أصبح مدرباً؟" : "Become an instructor" },
    { id: "certificates", label: lang === "ar" ? "الشهادات والتحقق" : "Certificates" },
    { id: "contact-support", label: lang === "ar" ? "التواصل مع الدعم" : "Contact support" },
  ];
  return suggestions;
};

export default faqs;

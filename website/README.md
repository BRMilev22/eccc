# 🌐 ChemEco Web Dashboard

## 💻 Професионална уеб платформа за визуализация на данни

Това е Node.js/Express уеб платформа, която предоставя професионален интерфейс за визуализация и анализ на данните от системата ChemEco. Платформата е създадена с фокус върху химическата тематика и образователната стойност на проекта.

### ✨ Основни функции

- 📊 **Интерактивна карта** - Визуализация на всички доклади в реално време
- 📈 **Статистически данни** - Анализ на докладите по различни критерии
- 🇧🇬 **Българска локализация** - Пълно превеждане на интерфейса
- 📱 **Responsive дизайн** - Оптимизация за всички устройства
- 🎨 **Chemistry тема** - Модерен дизайн с химическа естетика
- 🗺️ **Leaflet карти** - Интерактивна карта с Burgas като център
- 📸 **Галерия със снимки** - Преглед на качените изображения
- 🔄 **API интеграция** - Връзка с backend сървъра в реално време

### 🎨 Дизайн тема

Платформата използва Chemistry тема с:
- **Основен цвят:** #3b5998 (Химически син)
- **Вторичен цвят:** #4a6cb3 (Светъл син)
- **Акцентен цвят:** #2a407c (Тъмен син)
- **Фон:** #f5f8ff (Светъл син оттенък)

### 🏗️ Архитектура

```
website/
├── server.js              # Express сървър
├── package.json           # Зависимости
├── .env                   # Environment variables
├── public/               # Статични файлове
│   ├── css/              # Стилове
│   ├── js/               # JavaScript файлове
│   └── images/           # Изображения и лого
├── views/                # EJS темплейти
│   └── index.ejs         # Главна страница
└── routes/               # Express маршрути (бъдещо разширение)
```

## 🚀 Инсталация и стартиране

### Предварителни изисквания

- Node.js (версия 18 или по-висока)
- npm или yarn
- ChemEco API Server (работещ на порт 3000)

### Стъпки за инсталация

1. **Клониране на проекта**
```bash
git clone https://github.com/BRMilev22/eccc.git
cd eccc/website
```

2. **Инсталиране на зависимости**
```bash
npm install
```

3. **Конфигуриране на environment variables**
Създайте `.env` файл:
```env
# API Configuration
API_BASE_URL=http://localhost:3000/api
PORT=8080
NODE_ENV=development
```

4. **Стартиране на платформата**
```bash
npm start
# или за development
npm run dev
```

Платформата ще бъде достъпна на `http://localhost:8080`

## 🌟 Ключови компоненти

### 📊 Интерактивна карта
- **Leaflet.js** интеграция
- Център на картата: Бургас (42.5048, 27.4626)
- Маркери за всички доклади
- Popup прозорци с детайли
- Филтриране по тип отпадък и статус

### 📈 Статистически панел
- Общ брой доклади
- Решени проблеми
- Чакащи доклади
- Доклади в процес на решаване

### 🗂️ Категории отпадъци
| Тип | Описание | Химични характеристики |
|-----|----------|----------------------|
| 🥤 **PLASTIC** | Пластмасови отпадъци | Полимери (PET, PE, PP, PS) |
| 🍎 **FOOD** | Органични отпадъци | Биоразградими съединения |
| ☠️ **HAZARDOUS** | Опасни отпадъци | Токсични химикали |
| 📄 **PAPER** | Хартиени отпадъци | Целулозни влакна |
| 📱 **ELECTRONICS** | Електронни отпадъци | Рядкоземни елементи |
| 🗑️ **MIXED** | Смесени отпадъци | Композитни материали |

### ⚡ Статуси на докладите
- **REPORTED** 🔵 - Докладван (нов доклад)
- **IN_PROGRESS** 🟡 - В процес (обработва се)
- **CLEANED** 🟢 - Почистен (решен проблем)
- **VERIFIED** 🟣 - Потвърден (проверен от админ)

## 🛠️ Използвани технологии

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **EJS** - Template engine
- **Axios** - HTTP client за API заявки

### Frontend
- **Bootstrap 5** - CSS framework
- **Leaflet.js** - Интерактивни карти
- **Font Awesome** - Икони
- **Vanilla JavaScript** - Интерактивност

### Стилизиране
- **Custom CSS** - Chemistry тема
- **CSS Variables** - Консистентна цветова схема
- **Responsive Design** - Mobile-first подход
- **CSS Animations** - Плавни анимации

## 📱 Responsive дизайн

Платформата е оптимизирана за:
- 📱 **Mobile устройства** (320px+)
- 📟 **Tablets** (768px+)
- 💻 **Desktop** (1024px+)
- 🖥️ **Large screens** (1440px+)

## 🌐 API интеграция

### Връзка с ChemEco API
```javascript
// Конфигурация на API
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Получаване на доклади
app.get('/', async (req, res) => {
  const reports = await axios.get(`${API_BASE_URL}/reports`);
  // Обработка и рендериране
});
```

### Обработка на данни
- Картографиране на database полета към български език
- Валидация и филтриране на данни
- Обработка на грешки и fallback стойности

## 🎯 Основни страници

### Начална страница (/)
- **Hero секция** - ВСПИ лого и Chemistry тема
- **Статистики** - Real-time данни от API
- **За проекта** - Информация за ChemEco
- **Интерактивна карта** - Визуализация на докладите
- **Контакти** - Информация за връзка

### Компоненти
- **Navigation bar** - Фиксирана навигация
- **Statistics cards** - Анимирани статистически карти
- **Map container** - Responsive карта с Leaflet
- **Footer** - Информация и GitHub връзка

## 🔧 Конфигурация

### server.js
```javascript
// Helper функции за локализация
function getTrashTypeInBulgarian(type) {
  const types = {
    'PLASTIC': 'Пластмаса',
    'FOOD': 'Хранителни отпадъци',
    // ...други типове
  };
  return types[type] || type;
}

function getStatusInBulgarian(status) {
  const statuses = {
    'REPORTED': 'Докладван',
    'IN_PROGRESS': 'В процес',
    // ...други статуси
  };
  return statuses[status] || status;
}
```

### Environment Variables
```env
# API настройки
API_BASE_URL=http://localhost:3000/api

# Сървър настройки
PORT=8080
NODE_ENV=development

# Допълнителни настройки
MAX_REPORTS_DISPLAY=50
DEFAULT_MAP_CENTER_LAT=42.5048
DEFAULT_MAP_CENTER_LNG=27.4626
```

## 🎨 Стилизиране

### CSS Variables (Chemistry тема)
```css
:root {
  --primary-blue: #3b5998;    /* Основен химически син */
  --secondary-blue: #4a6cb3;   /* Светъл вариант */
  --accent-blue: #2a407c;      /* Тъмен акцент */
  --background-tint: #f5f8ff;  /* Светъл син фон */
  --text-dark: #333333;        /* Тъмен текст */
}
```

### Компонентни стилове
- **Hero секция** - Gradient фон с Chemistry цветове
- **ВСПИ лого** - Анимиран контейнер с бял фон
- **Статистически карти** - Hover ефекти и анимации
- **Карта** - Закръглени ъгли и сянки
- **Responsive navigation** - Mobile-friendly меню

## 🧪 Тестване

### Manual тестване
1. **API връзка** - Проверка на данните от сървъра
2. **Карта** - Тестване на маркерите и popup-ите
3. **Responsive дизайн** - Тестване на различни екрани
4. **Локализация** - Проверка на българския превод

### Browser compatibility
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## 🚀 Деплой

### Production настройки
```env
NODE_ENV=production
API_BASE_URL=https://your-api-domain.com/api
PORT=80
```

### Nginx конфигурация
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /css {
        alias /path/to/website/public/css;
        expires 1y;
    }
    
    location /js {
        alias /path/to/website/public/js;
        expires 1y;
    }
}
```

## 🔒 Сигурност

- **Input validation** - Валидация на API данни
- **XSS защита** - EJS автоматично escaping
- **CORS** - Конфигуриран за API връзки
- **Environment variables** - Сигурно съхранение на конфигурация

## 📊 SEO и Performance

### SEO оптимизации
- **Meta tags** - Описание и keywords
- **Semantic HTML** - Правилна структура
- **Bulgarian content** - Локализиран съдържание
- **Open Graph** - Social media preview

### Performance
- **CSS/JS минификация** - Оптимизирани файлове
- **Image optimization** - Компресирани изображения
- **Caching** - Browser и сървър кеширане
- **Lazy loading** - Оптимизирано зареждане

## 🐛 Отстраняване на проблеми

### Чести проблеми

1. **API връзка неуспешна**
   ```bash
   # Проверете API сървъра
   curl http://localhost:3000/api/reports
   ```

2. **Картата не се зарежда**
   - Проверете Leaflet CDN връзката
   - Валидирайте координатите на Бургас

3. **Статистиките не се обновяват**
   - Проверете API endpoint-а
   - Валидирайте обработката на данни

### Debug режим
```bash
DEBUG=website:* npm start
```

## 🔄 Бъдещи подобрения

- [ ] Admin панел за управление
- [ ] Филтриране на доклади
- [ ] Export на данни
- [ ] Push нотификации
- [ ] Multilingual поддръжка
- [ ] Dark mode тема
- [ ] Progressive Web App (PWA)

## 📄 Лиценз

Този проект е с отворен код под [MIT License](../LICENSE).

## 🤝 Принос

За въпроси или предложения относно уеб платформата, моля свържете се с разработчиците.

## 👥 Екип

- **Борис Милев** [@BRMilev22](https://github.com/BRMilev22) - Lead Developer & Mobile App
- **Веселин Боянов** [@VBBoyanov22](https://github.com/VBBoyanov22) - **Web Developer (Website)**
- **Димитър Димитраков** [@DPDimitrakov22](https://github.com/DPDimitrakov22) - Database & Testing
- **ПГКПИ** - Образователна поддръжка

## 🔗 Полезни връзки

- [Главен README](../README.md)
- [API Documentation](../api/README.md)
- [Mobile App Documentation](../mobile-app/README.md)
- [GitHub Repository](https://github.com/BRMilev22/eccc)
- [ПГКПИ](https://codingburgas.bg)

---

> **"Химия за устойчива околна среда"** - ChemEco Web 2025

*Разработено с ❤️ за опазване на природата и образованието в областта на химията*

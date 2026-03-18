# 📱 НИШ Инвентаризация — Mobile

Мобильное приложение для инвентаризации основных средств НИШ Туркестан.
Сканирование штрих-кодов через камеру, ручной ввод, статистика по кабинетам, история сканирований.

> 🖥️ Бэкенд: [1c-asset-inventory-server](https://github.com/YOUR_USERNAME/1c-asset-inventory-server)

---

## Стек

- **React Native** + **Expo**
- **TypeScript**
- **Expo Router** — навигация
- **Expo Camera** — сканирование штрих-кодов
- **AsyncStorage** — сохранение имени и адреса сервера

---

## Экраны

| Экран | Описание |
|-------|----------|
| **Вход** | Ввод имени сотрудника и IP-адреса сервера |
| **Сессии** | Список инвентаризаций |
| **Сканер** | Сканирование через камеру или ручной ввод |
| **Результат** | Карточка с результатом сканирования |
| **История** | Последние 50 сканирований за сессию |
| **Статистика** | Прогресс по кабинетам |
| **Перемещение** | Указать новый кабинет или сотрудника для ОС |

---

## Быстрый старт

### 1. Установить зависимости

```bash
npm install
```

### 2. Запустить приложение

```bash
npx expo start
```

Установить **Expo Go** на телефон → отсканировать QR-код из терминала.

---

## Подключение к серверу

При первом запуске приложение откроет экран входа где нужно указать:

- **Имя** — будет записано в акт инвентаризации
- **Адрес сервера** — IP и порт, без `http://` и `/api`

```
Пример: 192.168.1.100:8888
```

> ⚠️ Телефон и компьютер должны быть в одной Wi-Fi сети.
> `localhost` с телефона **не работает** — нужен реальный IP.

Узнать IP компьютера на Windows:
```powershell
ipconfig
# IPv4 адрес — обычно 192.168.x.x
```

---

## Структура проекта

```
mobile/
├── app/
│   ├── components/
│   │   ├── scan/                   # Компоненты экрана сканирования
│   │   │   ├── CameraScanner.tsx   # Камера со сканированием штрих-кода
│   │   │   ├── HistoryScreen.tsx   # История последних сканирований
│   │   │   ├── ManualInput.tsx     # Ручной ввод инв. номера или штрих-кода
│   │   │   ├── RelocateModal.tsx   # Модалка перемещения ОС
│   │   │   ├── ScanHeader.tsx      # Шапка экрана сканирования
│   │   │   ├── ScanResultCard.tsx  # Карточка результата сканирования
│   │   │   ├── StatsByLocationScreen.tsx  # Прогресс по кабинетам
│   │   │   └── types.ts
│   │   └── session/                # Компоненты экрана сессии
│   │       ├── SessionHeader.tsx
│   │       ├── SessionItemCard.tsx
│   │       ├── SessionRelocateModal.tsx
│   │       ├── SessionTabs.tsx
│   │       └── types.ts
│   └── session/                    # Экраны (Expo Router)
│       ├── [id].tsx                # Страница сессии
│       ├── _layout.tsx
│       ├── index.tsx               # Экран входа
│       ├── scan.tsx                # Экран сканирования
│       └── sessions.tsx            # Список сессий
├── assets/                         # Иконки и изображения
├── constants/
│   ├── api.ts                      # Axios клиент
│   └── colors.ts                   # Цветовая палитра
├── .gitignore
├── app.json                        # Конфиг Expo
├── eas.json                        # Конфиг EAS сборки
├── package.json
├── tsconfig.json
└── README.md
```

---

## Сборка APK (Android)

> ⚠️ Папка `android` генерируется заново при каждом `prebuild`.
> После этого нужно вручную настроить HTTP-доступ к серверу — два способа ниже.

### Шаг 1 — Сгенерировать папку android

```bash
npx expo prebuild --platform android
```

### Шаг 2 — Разрешить HTTP запросы к серверу

Android 9+ по умолчанию блокирует HTTP. Есть два способа:

---

#### Способ А — через AndroidManifest.xml (проще, рекомендуется)

Открыть файл:
```
android\app\src\main\AndroidManifest.xml
```

Добавить `android:usesCleartextTraffic="true"` в тег `<application>`:

```xml
<application
  android:usesCleartextTraffic="true"
  android:label="@string/app_name"
  ...
>
```

✅ Делается один раз. Разрешает HTTP для любого IP — удобно для корпоративной сети.

---

#### Способ Б — через network_security_config.xml (для конкретного IP)

**1.** Создать папку `xml` если её нет:
```
android\app\src\main\res\xml\
```

**2.** Создать файл `network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">192.168.1.100</domain>
    </domain-config>
</network-security-config>
```

Заменить `192.168.1.100` на реальный IP вашего сервера.

**3.** Подключить файл в `AndroidManifest.xml`:
```xml
<application
  android:networkSecurityConfig="@xml/network_security_config"
  ...
>
```

> ⚠️ Этот файл нужно создавать заново после каждого `npx expo prebuild`
> и обновлять IP если он изменился.

---

### Шаг 3 — Собрать APK

```powershell
cd android
gradlew assembleRelease
```

Готовый APK будет здесь:
```
android\app\build\outputs\apk\release\app-release.apk
```

---

## Установка APK на телефон (без adb)

### Шаг 1 — Подключить телефон кабелем

На телефоне выбрать **"Передача файлов"** (MTP), не "Зарядка".

### Шаг 2 — Скопировать APK на телефон

Открыть проводник Windows, перейти в:
```
android\app\build\outputs\apk\release\
```

Скопировать `app-release.apk` на телефон:
```
Этот компьютер → [Ваш телефон] → Внутреннее хранилище → Загрузки
```

### Шаг 3 — Установить на телефоне

Диспетчер файлов → Загрузки → нажать на APK → **Установить**.

Если появится предупреждение:
```
Настройки → Безопасность → Разрешить установку из неизвестных источников
```

---

## Важные файлы Android

| Файл | Описание | Коммитить? |
|------|----------|------------|
| `android/local.properties` | Путь к Android SDK на вашем ПК | ❌ Нет — у каждого свой |
| `android/app/src/main/AndroidManifest.xml` | Разрешения приложения | ✅ Да |
| `android/app/src/main/res/xml/network_security_config.xml` | Разрешённые IP для HTTP | ⚠️ Создаётся вручную после каждого prebuild |

---

## Диагностика

**Не подключается к серверу после установки APK:**
```
1. Убедиться что добавлен android:usesCleartextTraffic="true" в AndroidManifest.xml
   или создан network_security_config.xml с правильным IP
2. Телефон и ПК в одной Wi-Fi сети
3. Открыть порт в фаерволе Windows:
   netsh advfirewall firewall add rule name="inventory" dir=in action=allow protocol=TCP localport=8888
```

**В Expo Go работает, в APK нет:**
```
Android 9+ блокирует HTTP запросы — не настроен AndroidManifest.xml
Добавить android:usesCleartextTraffic="true" и пересобрать APK
```

**Камера не работает:**
```
Настройки → Приложения → НИШ Инвентаризация → Разрешения → Камера → Разрешить
```

**Штрих-код не сканируется:**
```
1. Убедитесь что освещение достаточное
2. Держите телефон ровно над штрих-кодом
3. Используйте ручной ввод как альтернативу
```

---

## Лицензия

MIT
<a id="anchor"></a>
##### README.markdown

### criptoarbitr_test - вспомогательное приложениe исследовательского проекта [Criptoarbitr](http://criptoarbitr.178.20.42.150.sslip.io/)

**Функции testsqueezebith :**
* Анализ скорости (ping) поступления информации о котировках между своим сервером и биржой Bithump Global (Bithumb.pro)
* Запись данных в файл при превышении 1.5% цены вверх или вниз от средней цены за последние 5 минут
* Запись всех данных в файл :
* цена sell, buy
    + время сервера Bithump источник №1
    + время сервера Bithump источник №2
    + разница времени между “своим” сервером и двумя источниками времени Bithump
    + нахождение средней разницы во времени между “своим” сервером и двумя источниками времени Bithump
* Принятие решения - получение сигнала при достижении необходимой прибыли ( профита)
* Запись данных в .CSV файл основных параметров котировок с максимальной детализацией

### Проект состоит из двух back-end приложений и одного front-end приложения:

**back-end :**
* [criptoarbitr_test](https://github.com/illusionoff/criptoarbitr_test) - основное приложениe
* [testsqueezebith](https://github.com/illusionoff/testsqueezebith) - вспомогательное приложениe

**front-end :**
* [reactcriptoarbitr_test_squeeze](https://github.com/illusionoff/reactcriptoarbitr_test_squeeze) - размещение информации о проекте, вывод данных работы проекта в виде графиков

[Вверх](#anchor)

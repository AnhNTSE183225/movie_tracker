const GENRE_KEYS = {
    ACTION: "action",
    ANIMATED: "animated",
    BRAINFUCK: "brainfuck",
    COMEDY: "comedy",
    FANTASY: "fantasy",
    HORROR: "horror",
    ZOMBIES: "zombies",
};

const SUGGESTOR_KEYS = {
    ANH_NGUYEN: "anh_nguyen",
    DANH_PHAN: "danh_phan",
    LONG_NGUYEN: "long_nguyen",
    NAM_PHAN: "nam_phan",
    THAO_DAO: "thao_dao",
};

const GENRE_LABELS = {
    [GENRE_KEYS.ACTION]: "Action",
    [GENRE_KEYS.ANIMATED]: "Animated",
    [GENRE_KEYS.BRAINFUCK]: "Brainfuck",
    [GENRE_KEYS.COMEDY]: "Comedy",
    [GENRE_KEYS.FANTASY]: "Fantasy",
    [GENRE_KEYS.HORROR]: "Horror",
    [GENRE_KEYS.ZOMBIES]: "Zombies",
};

const SUGGESTOR_LABELS = {
    [SUGGESTOR_KEYS.ANH_NGUYEN]: "Anh Nguyen",
    [SUGGESTOR_KEYS.DANH_PHAN]: "Danh Phan",
    [SUGGESTOR_KEYS.LONG_NGUYEN]: "Long Nguyen",
    [SUGGESTOR_KEYS.NAM_PHAN]: "Nam Phan",
    [SUGGESTOR_KEYS.THAO_DAO]: "Thao Dao",
};

window.MOVIE_THEME = {
    genreColors: {
        [GENRE_KEYS.ACTION]: "#8ab0ff",
        [GENRE_KEYS.ANIMATED]: "#84d8c4",
        [GENRE_KEYS.BRAINFUCK]: "#f6c453",
        [GENRE_KEYS.COMEDY]: "#f08d70",
        [GENRE_KEYS.FANTASY]: "#df8cff",
        [GENRE_KEYS.HORROR]: "#5cc6ff",
        [GENRE_KEYS.ZOMBIES]: "#a9d66f",
    },
};

window.MOVIE_DATA = {
    genres: GENRE_LABELS,
    suggestors: SUGGESTOR_LABELS,
    movies: [
        { title: "Inception", year: 2010, genre: GENRE_KEYS.BRAINFUCK, rating: 9.2, suggestors: [SUGGESTOR_KEYS.NAM_PHAN, SUGGESTOR_KEYS.LONG_NGUYEN] },
        { title: "Dungeons & Dragons: Honour Among Thieves", year: 2023, genre: GENRE_KEYS.FANTASY, rating: 9.0, suggestors: [SUGGESTOR_KEYS.ANH_NGUYEN] },
        { title: "Kingsman: The Secret Service", year: 2014, genre: GENRE_KEYS.ACTION, rating: 8.8, suggestors: [SUGGESTOR_KEYS.ANH_NGUYEN] },
        { title: "White Chicks", year: 2004, genre: GENRE_KEYS.COMEDY, rating: 8.3, suggestors: [SUGGESTOR_KEYS.NAM_PHAN] },
        { title: "The Substance", year: 2024, genre: GENRE_KEYS.HORROR, rating: 8.0, suggestors: [SUGGESTOR_KEYS.ANH_NGUYEN] },
        { title: "Goat", year: 2026, genre: GENRE_KEYS.ANIMATED, rating: 6.5, suggestors: [SUGGESTOR_KEYS.ANH_NGUYEN] },
        { title: "Smile", year: 2022, genre: GENRE_KEYS.HORROR, rating: 5.5, suggestors: [SUGGESTOR_KEYS.ANH_NGUYEN] },
        { title: "Smile 2", year: 2024, genre: GENRE_KEYS.HORROR, rating: 5.4, suggestors: [SUGGESTOR_KEYS.ANH_NGUYEN] },
        { title: "28 Days Later", year: 2002, genre: GENRE_KEYS.ZOMBIES, rating: 4.0, suggestors: [SUGGESTOR_KEYS.LONG_NGUYEN] },
        { title: "Hoppers", year: 2026, genre: GENRE_KEYS.ANIMATED, rating: 3.6, suggestors: [SUGGESTOR_KEYS.ANH_NGUYEN] },
        { title: "Us", year: 2019, genre: GENRE_KEYS.HORROR, rating: 3.4, suggestors: [SUGGESTOR_KEYS.DANH_PHAN] },
        { title: "28 Weeks Later", year: 2007, genre: GENRE_KEYS.ZOMBIES, rating: 3.0, suggestors: [SUGGESTOR_KEYS.LONG_NGUYEN] },
        { title: "Alien: Romulus", year: 2024, genre: GENRE_KEYS.HORROR, rating: 2.9, suggestors: [SUGGESTOR_KEYS.DANH_PHAN, SUGGESTOR_KEYS.LONG_NGUYEN] },
        { title: "Snow White", year: 2025, genre: GENRE_KEYS.FANTASY, rating: 1.6, suggestors: [SUGGESTOR_KEYS.ANH_NGUYEN] },
        { title: "Morbius", year: 2022, genre: GENRE_KEYS.HORROR, rating: 0.0, suggestors: [SUGGESTOR_KEYS.DANH_PHAN] },
        { title: "Cù Lao Xác Sống", year: 2022, genre: GENRE_KEYS.ZOMBIES, rating: -8.0, suggestors: [SUGGESTOR_KEYS.THAO_DAO] },
        { title: "Scary Movie", year: 2000, genre: GENRE_KEYS.COMEDY, rating: null, suggestors: [SUGGESTOR_KEYS.ANH_NGUYEN] },
        { title: "Kingsman: The Golden Circle", year: 2017, genre: GENRE_KEYS.ACTION, rating: 6.0, suggestors: [SUGGESTOR_KEYS.ANH_NGUYEN] },
        { title: "American Horror Stories (Series)", year: 2021, genre: GENRE_KEYS.HORROR, rating: null, suggestors: [SUGGESTOR_KEYS.ANH_NGUYEN] },
    ],
};
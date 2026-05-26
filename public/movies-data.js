const GENRE = {
    ACTION: "action",
    ANIMATED: "animated",
    BRAINFUCK: "brainfuck",
    COMEDY: "comedy",
    FANTASY: "fantasy",
    HORROR: "horror",
    ZOMBIES: "zombies",
};

const SUGGESTOR = {
    ANH_NGUYEN: "anh_nguyen",
    DANH_PHAN: "danh_phan",
    LONG_NGUYEN: "long_nguyen",
    NAM_PHAN: "nam_phan",
    THAO_DAO: "thao_dao",
};

const GENRES = {
    [GENRE.ACTION]: "Action",
    [GENRE.ANIMATED]: "Animated",
    [GENRE.BRAINFUCK]: "Brainfuck",
    [GENRE.COMEDY]: "Comedy",
    [GENRE.FANTASY]: "Fantasy",
    [GENRE.HORROR]: "Horror",
    [GENRE.ZOMBIES]: "Zombies",
};

const SUGGESTORS = {
    [SUGGESTOR.ANH_NGUYEN]: "Anh Nguyen",
    [SUGGESTOR.DANH_PHAN]: "Danh Phan",
    [SUGGESTOR.LONG_NGUYEN]: "Long Nguyen",
    [SUGGESTOR.NAM_PHAN]: "Nam Phan",
    [SUGGESTOR.THAO_DAO]: "Thao Dao",
};

window.MOVIE_DATA = {
        genres: GENRES,
        suggestors: SUGGESTORS,
    movies: [
        { title: "Inception", year: 2010, genre: GENRE.BRAINFUCK, rating: 9.2, suggestors: [SUGGESTOR.NAM_PHAN, SUGGESTOR.LONG_NGUYEN] },
        { title: "Dungeons & Dragons: Honour Among Thieves", year: 2023, genre: GENRE.FANTASY, rating: 9.0, suggestors: [SUGGESTOR.ANH_NGUYEN] },
        { title: "Kingsman: The Secret Service", year: 2014, genre: GENRE.ACTION, rating: 8.8, suggestors: [SUGGESTOR.ANH_NGUYEN] },
        { title: "White Chicks", year: 2004, genre: GENRE.COMEDY, rating: 8.3, suggestors: [SUGGESTOR.NAM_PHAN] },
        { title: "The Substance", year: 2024, genre: GENRE.HORROR, rating: 8.0, suggestors: [] },
        { title: "Goat", year: 2026, genre: GENRE.ANIMATED, rating: 6.5, suggestors: [SUGGESTOR.ANH_NGUYEN] },
        { title: "Smile", year: 2022, genre: GENRE.HORROR, rating: 5.5, suggestors: [SUGGESTOR.ANH_NGUYEN] },
        { title: "Smile 2", year: 2024, genre: GENRE.HORROR, rating: 5.4, suggestors: [SUGGESTOR.ANH_NGUYEN] },
        { title: "28 Days Later", year: 2002, genre: GENRE.ZOMBIES, rating: 4.0, suggestors: [SUGGESTOR.LONG_NGUYEN] },
        { title: "Hoppers", year: 2026, genre: GENRE.ANIMATED, rating: 3.6, suggestors: [SUGGESTOR.ANH_NGUYEN] },
        { title: "Us", year: 2019, genre: GENRE.HORROR, rating: 3.4, suggestors: [SUGGESTOR.DANH_PHAN] },
        { title: "28 Weeks Later", year: 2007, genre: GENRE.ZOMBIES, rating: 3.0, suggestors: [SUGGESTOR.LONG_NGUYEN] },
        { title: "Alien: Romulus", year: 2024, genre: GENRE.HORROR, rating: 2.9, suggestors: [SUGGESTOR.DANH_PHAN, SUGGESTOR.LONG_NGUYEN] },
        { title: "Snow White", year: 2025, genre: GENRE.FANTASY, rating: 1.6, suggestors: [SUGGESTOR.ANH_NGUYEN] },
        { title: "Morbius", year: 2022, genre: GENRE.HORROR, rating: 0.0, suggestors: [SUGGESTOR.DANH_PHAN] },
        { title: "Cù Lao Xác Sống", year: 2022, genre: GENRE.ZOMBIES, rating: -8.0, suggestors: [SUGGESTOR.THAO_DAO] },
        { title: "Scary Movie", year: 2000, genre: GENRE.COMEDY, rating: null, suggestors: [SUGGESTOR.ANH_NGUYEN] },
        { title: "Kingsman: The Golden Circle", year: 2017, genre: GENRE.ACTION, rating: 6.0, suggestors: [SUGGESTOR.ANH_NGUYEN] },
    ],
};
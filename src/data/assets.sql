-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Erstellungszeit: 18. Nov 2025 um 16:44
-- Server-Version: 10.11.4-MariaDB-1:10.11.4+maria~deb11-log
-- PHP-Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `web284_db11`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `assets`
--

CREATE TABLE `assets` (
  `id` int(11) NOT NULL,
  `external_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `gender` enum('male','female','neutral') NOT NULL DEFAULT 'neutral',
  `icon_url` text NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `required_level` int(11) NOT NULL DEFAULT 1,
  `price_dias` int(11) NOT NULL DEFAULT 0,
  `meta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`meta`)),
  `created` datetime NOT NULL,
  `modified` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Daten für Tabelle `assets`
--

INSERT INTO `assets` (`id`, `external_id`, `name`, `description`, `type`, `gender`, `icon_url`, `active`, `required_level`, `price_dias`, `meta`, `created`, `modified`) VALUES
(1, '9247420', 'hair-01', 'Kurze Standardfrisur', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/9247420/1622793819-hair-01-1699880607487.png', 1, 1, 2, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(2, '9247416', 'glasses-01', 'Einfache Brille', 'glasses', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/9247416/1623141469-glasses-01-1699880599688.png', 1, 1, 3, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(3, '9247475', 'hair-20', 'Mittellange Frisur', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/9247475/1622793857-hair-20-1699880589134.png', 1, 2, 3, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(4, '23393768', 'glasses-05', 'Schmale Brille', 'glasses', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/23393768/1622793749-glasses-05-1699880599705.png', 1, 2, 3, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(5, '146120431', 'pants-casual-01', 'Einfache Freizeithose', 'bottom', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/146120431/1674645936-pants-casual-01-black-1699880490112.png', 1, 2, 5, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(6, '109373713', 'outfit-basicrpm-02-v2-m', 'Einfaches Basis-Outfit (m)', 'outfit', 'male', 'https://files.readyplayer.me/asset/iconUrl/109373713/1645186962-outfit-basicrpm-02-v2-m-1699880511755.png', 1, 3, 10, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(7, '47431267', 'outfit-f-casual-09-v2', 'Lässiges Alltags-Outfit (f)', 'outfit', 'female', 'https://files.readyplayer.me/asset/iconUrl/47431267/1625842862-outfit-f-casual-09-v2-1699880571044.png', 1, 3, 10, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(8, '9247539', 'hair-30', 'Mittellanger Stufenschnitt', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/9247539/1622793877-hair-30-1699880609632.png', 1, 3, 4, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(9, '145857239', 'top-tshirt-01', 'Einfaches T-Shirt', 'top', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/145857239/1692361178-top-tshirt-01-white-1699880485438.png', 1, 3, 5, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(10, '9247554', 'hair-44', 'Frisur mit Seitenscheitel', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/9247554/1632814261-hair-44-1699880558216.png', 1, 4, 5, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(11, '9929037', 'glasses-17', 'Runde Brille', 'glasses', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/9929037/1622793773-glasses-17-1699880600902.png', 1, 4, 4, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(12, '146120526', 'tennis-casual-01', 'Sportliche Sneakers', 'footwear', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/146120526/1674646299-tennis-casual-01-beige-1699880507338.png', 1, 4, 8, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(13, '42465569', 'headwear-beanie-01', 'Beanie-Mütze', 'headwear', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/42465569/1623398832-headwear-beanie-01-1699880533696.png', 1, 4, 6, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(14, '122450731', 'outfit-archer-01-v2-m', 'Bogenschützen-Outfit (m)', 'outfit', 'male', 'https://files.readyplayer.me/asset/iconUrl/122450731/1656519071-outfit-archer-01-v2-m-1699880513173.png', 1, 5, 20, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(15, '122513723', 'outfit-archer-01-v2-f', 'Bogenschützen-Outfit (f)', 'outfit', 'female', 'https://files.readyplayer.me/asset/iconUrl/122513723/1656585408-outfit-archer-01-v2-f-1699880513204.png', 1, 5, 20, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(16, '146120748', 'pants-jeans-01', 'Basic Jeans', 'bottom', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/146120748/1687340371-pants-jeans-01-color1-1699880494191.png', 1, 5, 8, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(17, '11800648', 'glasses-33', 'Moderne Brille', 'glasses', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/11800648/1622793805-glasses-33-1699880599698.png', 1, 6, 6, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(18, '11804862', 'hair-56', 'Moderner Kurzhaarschnitt', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/11804862/1622793930-hair-56-1699880625997.png', 1, 6, 6, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(19, 'zj3Y_TQJR4mNqPIJZJPkxg', 'jacket-puffed-02-black', 'Schwarze Pufferjacke', 'top', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/zj3Y_TQJR4mNqPIJZJPkxg/1697459594-jacket-puffed-02-black-1699446953965.png', 1, 6, 12, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(20, '41887474', 'headwear-baseball-01', 'Basecap', 'headwear', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/41887474/1623079417-headwear-baseball-01-1699880556850.png', 1, 7, 8, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(21, '146089198', 'boots-combat-01', 'Kampf-Boots', 'footwear', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/146089198/1674548422-boots-combat-01-black-1699880481616.png', 1, 7, 12, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(22, '6_JvB8dVQdSSw5kLE3AycA', 'top-tshirt-01-wine', 'Bordeaux T-Shirt', 'top', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/6_JvB8dVQdSSw5kLE3AycA/c8553cda-fff2-44c2-8eac-1f80d8db8f66-1706108558374.png', 1, 7, 10, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(23, '40465568', 'hair-73', 'Langer Seitenschnitt', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/40465568/1621947684-hair-73-1699880590260.png', 1, 8, 10, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(24, '42027493', 'glasses-45', 'Eckige Designerbrille', 'glasses', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/42027493/1623163376-glasses-45-1699880581427.png', 1, 8, 8, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(25, 'pe32_IT1S2yshCFIcX0DQg', 'jacket-sport-01-halfdenim', 'Sportjacke Denim', 'top', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/pe32_IT1S2yshCFIcX0DQg/1699030125-jacket-sport-01-halfdenim-1699446449296.png', 1, 8, 18, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(26, '40524678', 'hair-85', 'Lockere Wellenfrisur', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/40524678/1621957409-hair-85-1699880583385.png', 1, 9, 12, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(27, '146120867', 'tennis-sport-01', 'Sportliche Turnschuhe', 'footwear', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/146120867/1674647355-tennis-sport-01-mint-1699880497902.png', 1, 9, 20, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(28, '146142477', 'pants-military-01', 'Military Hose', 'bottom', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/146142477/1691672034-pants-military-01-scifi-1699880500241.png', 1, 9, 15, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(29, '26549796', 'outfit-m-cyberpunk-02-v2', 'Cyberpunk Outfit (m)', 'outfit', 'male', 'https://files.readyplayer.me/asset/iconUrl/26549796/1630662869-outfit-cyberpunk-02-v2-m-1699880630689.png', 1, 10, 150, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(30, '104990781', 'outfit-costume-04-v2-f', 'Kostüm-Outfit (f)', 'outfit', 'female', 'https://files.readyplayer.me/asset/iconUrl/104990781/1644254436-outfit-costume-04-v2-f-1699880526744.png', 1, 10, 150, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(31, '120900701', 'headwear-racing-02', 'Rennfahrer-Helm', 'headwear', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/120900701/1649264016-headwear-racing-02-1699880515247.png', 1, 10, 25, NULL, '2025-11-18 16:18:13', '2025-11-18 16:18:13'),
(54, '38134006', 'outfit-f-medievalplumeria-02-v2', 'Medieval Outfit', 'outfit', 'female', 'https://files.readyplayer.me/asset/iconUrl/38134006/1622444454-outfit-f-medievalplumeria-02-v2-1699880583370.png', 0, 1, 0, NULL, '2025-11-18 16:26:05', '2025-11-18 16:26:05'),
(55, '46269019', 'outfit-f-racer-03-v2', 'Racer Outfit', 'outfit', 'female', 'https://files.readyplayer.me/asset/iconUrl/46269019/1625483832-outfit-f-racer-03-v2-1699880573762.png', 0, 1, 0, NULL, '2025-11-18 16:26:05', '2025-11-18 16:26:05'),
(56, '95782635', 'outfit-m-medievaltaurus-01-v2', 'Outfit Medieval', 'outfit', 'male', 'https://files.readyplayer.me/asset/iconUrl/95782635/1617054442-outfit-m-medievaltaurus-01-v2-1699880561320.png', 0, 1, 0, NULL, '2025-11-18 16:26:05', '2025-11-18 16:26:05'),
(57, '120843794', 'outfit-rogue-01-v2-m', 'Outfit Rogue', 'outfit', 'male', 'https://files.readyplayer.me/asset/iconUrl/120843794/1649151869-outfit-rogue-01-v2-m-1699880515101.png', 0, 1, 0, NULL, '2025-11-18 16:26:05', '2025-11-18 16:26:05'),
(58, '146120161', 'pants-adventure-01', 'Abenteuer Hose', 'bottom', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/146120161/1691682937-pants-adventure-01-color03-1699880477990.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(59, 'x5cj70J1RXGeNupHA6-xlg', 'pants-cargo-01-blackzipper', 'Cargo Hose', 'bottom', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/x5cj70J1RXGeNupHA6-xlg/1698942405-pants-cargo-01-beige-1699440313902.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(60, 'cXRIxF8WRJ6zcmj78yp3hA', 'pants-cargo-01-blackzipper', 'Cargo Hose Schwarz', 'bottom', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/cXRIxF8WRJ6zcmj78yp3hA/1698942384-pants-cargo-01-blackzipper-1699440339562.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(61, 'rbGTy_C0Rp-9HcOpwUQOQw', 'pants-casual-01-italian', 'Italien Hose', 'bottom', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/rbGTy_C0Rp-9HcOpwUQOQw/1698942894-pants-casual-01-italian-1698942899934.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(62, '145064644', 'pants-casual-02', 'Freizeit Hose', 'bottom', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/145064644/1673877306-pants-casual-02-1699880503919.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(63, '9247568', 'glasses-07', 'Brille 07', 'glasses', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/9247568/1622793753-glasses-07-1699880600839.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(64, '9928956', 'glasses-08', 'Brille 08', 'glasses', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/9928956/1623141848-glasses-08-1699880533722.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(65, '9247558', 'glasses-18', 'Brille 18', 'glasses', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/9247558/1622793775-glasses-18-1699880522396.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(66, '9247564', 'glasses-20', 'Brille 20', 'glasses', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/9247564/1622793779-glasses-20-1699880600869.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(67, '9932563', 'glasses-21', 'Brille 21', 'glasses', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/9932563/1622793781-glasses-21-1699880600904.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(68, '10565929', 'glasses-29', 'Brille 29', 'glasses', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/10565929/1622793797-glasses-29-1699880598395.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(69, '18947981', 'glasses-37', 'Brille 37', 'glasses', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/18947981/1623140458-glasses-37-1699880598419.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(70, '40606583', 'glasses-38', 'Brille 38', 'glasses', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/40606583/1621948946-glasses-38-1699880596962.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(71, '42006568', 'glasses-42', 'Brille 42', 'glasses', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/42006568/1623153559-glasses-42-1699880580032.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(72, '42012214', 'glasses-43', 'Brille 43', 'glasses', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/42012214/1623153698-glasses-43-1699880580028.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(73, '45320792', 'glasses-47', 'Brille 47', 'glasses', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/45320792/1624967654-glasses-47-1699880574835.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(74, '45537981', 'glasses-48', 'Brille 48', 'glasses', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/45537981/1625048242-glasses-48-1699880576518.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(75, '48055947', 'glasses-66', 'Brille 66', 'glasses', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/48055947/1626360949-glasses-66-1699880571037.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(76, '77045896', 'glasses-67', 'Brille 67', 'glasses', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/77045896/1637767650-glasses-67-1699880532330.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(77, '106638139', 'glasses-68', 'Brille 68', 'glasses', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/106638139/1644478767-glasses-68-1699880522429.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(78, '9247430', 'hair-09', 'Haare 09', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/9247430/1622793835-hair-09-1699880608557.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(79, '50051765', 'hair-112', 'Haare 112', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/50051765/1632818093-hair-112-1699880568198.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(80, '147536069', 'hair-116', 'Haare 116', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/147536069/1680105201-hair-116-1699885505717.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(81, '9247574', 'hair-51', 'Haare 51', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/9247574/1622793919-hair-51-1699880589010.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(82, '19251134', 'hair-59', 'Haare 59', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/19251134/1622793935-hair-59-1699880607523.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(83, '16845783', 'hair-60', 'Haare 60', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/16845783/1622793937-hair-60-1699880606207.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(84, '22332634', 'hair-61', 'Haare 61', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/22332634/1622793939-hair-61-1699880602976.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(85, '22341158', 'hair-62', 'Haare 62', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/22341158/1622793941-hair-62-1699880602987.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(86, '22385401', 'hair-64', 'Haare 64', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/22385401/1622793946-hair-64-1699880589214.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(87, '22396922', 'hair-65', 'Haare 65', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/22396922/1622793948-hair-65-1699880602967.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(88, '39291588', 'hair-70', 'Haare 70', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/39291588/1621957461-hair-70-1699880558239.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(89, '39292290', 'hair-71', 'Haare 71', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/39292290/1620984305-hair-71-1699880586599.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(90, '39101102', 'hair-72', 'Haare 72', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/39101102/1621957551-hair-72-1699880590296.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(91, '38775805', 'hair-74', 'Haare 74', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/38775805/1625645551-hair-74-1699880589012.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(92, '39574673', 'hair-76', 'Haare 76', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/39574673/1621272001-hair-76-1699880586568.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(93, '39645096', 'hair-79', 'Haare 79', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/39645096/1621957589-hair-79-1699880590292.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(94, '40466374', 'hair-84', 'Haare 84', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/40466374/1621850838-hair-84-1699880586585.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(95, '40597504', 'hair-86', 'Haare 86', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/40597504/1621938483-hair-86-1699880586583.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48'),
(96, '49564519', 'hair-94', 'Haare 94', 'hair', 'neutral', 'https://files.readyplayer.me/asset/iconUrl/49564519/1627382543-hair-94-1699880569815.png', 0, 1, 0, NULL, '2025-11-18 16:43:48', '2025-11-18 16:43:48');

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `assets`
--
ALTER TABLE `assets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_assets_external_id` (`external_id`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `assets`
--
ALTER TABLE `assets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=97;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

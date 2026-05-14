// Original fb-series art
import emberfangImg from '../public/images/creatures/aaron_fb3_001.png';
import moonlitMothImg from '../public/images/creatures/aaron_fb2_003.png';
import crystalToadImg from '../public/images/creatures/aaron_fb2_005.png';
import shadowSproutImg from '../public/images/creatures/aaron_fb1_005.png';
import azureGriffinImg from '../public/images/creatures/aaron_fb5_005.png';
import goldenGoblinImg from '../public/images/creatures/aaron_fb2_002.png';
import neonWyvernImg from '../public/images/creatures/aaron_fb5_002.png';
import ancientSlimeKingImg from '../public/images/creatures/aaron_fb4_002.png';
import hollowFoxImg from '../public/images/creatures/aaron_fb1_004.png';
import starfallSerpentImg from '../public/images/creatures/aaron_fb5_004.png';
import pebblePupImg from '../public/images/creatures/aaron_fb1_002.png';
import rustKnightImg from '../public/images/creatures/aaron_fb3_002.png';
import auroraFinchImg from '../public/images/creatures/aaron_fb5_001.png';
import glacialWurmImg from '../public/images/creatures/aaron_fb4_001.png';
import moltenMimicImg from '../public/images/creatures/aaron_fb1_001.png';
import stormPaladinImg from '../public/images/creatures/aaron_fb3_005.png';
import lavaLarvaImg from '../public/images/creatures/aaron_fb3_003.png';
import verdantVipersImg from '../public/images/creatures/aaron_fb2_001.png';
import ironJuggernautImg from '../public/images/creatures/aaron_fb4_004.png';
import glittermouseImg from '../public/images/creatures/aaron_fb1_003.png';
import voidcallerImg from '../public/images/creatures/aaron_fb3_004.png';
import spectralKoiImg from '../public/images/creatures/aaron_fb4_003.png';
import cinderCherubImg from '../public/images/creatures/aaron_fb4_005.png';
import thornfoxImg from '../public/images/creatures/aaron_fb5_003.png';
import cosmicKoalithImg from '../public/images/creatures/aaron_fb2_004.png';

// New gp0-series art
import oracleNewtImg from '../public/images/creatures/aaron_gp0_022.png';
import mirrorImpImg from '../public/images/creatures/aaron_gp0_002.png';
import brambleCatImg from '../public/images/creatures/aaron_gp0_001.png';
import pebbleChargerImg from '../public/images/creatures/aaron_gp0_003.png';
import dustwingImg from '../public/images/creatures/aaron_gp0_004.png';
import twigsnatchSparrowImg from '../public/images/creatures/aaron_gp0_005.png';
import crimsonRaptorImg from '../public/images/creatures/aaron_gp0_006.png';
import hearthkitImg from '../public/images/creatures/aaron_gp0_007.png';
import midnightStalkerImg from '../public/images/creatures/aaron_gp0_008.png';
import frosthootOwlImg from '../public/images/creatures/aaron_gp0_009.png';
import eldritchHuskImg from '../public/images/creatures/aaron_gp0_010.png';
import frostfangWolfImg from '../public/images/creatures/aaron_gp0_011.png';
import burlybearImg from '../public/images/creatures/aaron_gp0_012.png';
import stagcoralImg from '../public/images/creatures/aaron_gp0_013.png';
import hornshellBeetleImg from '../public/images/creatures/aaron_gp0_014.png';
import yokaiTricksterImg from '../public/images/creatures/aaron_gp0_015.png';
import brambleHowlerImg from '../public/images/creatures/aaron_gp0_016.png';
import twisterImpImg from '../public/images/creatures/aaron_gp0_017.png';
import coralCatImg from '../public/images/creatures/aaron_gp0_018.png';
import acornStashImg from '../public/images/creatures/aaron_gp0_019.png';
import twilightPetalImg from '../public/images/creatures/aaron_gp0_020.png';
import whiskerlingImg from '../public/images/creatures/aaron_gp0_021.png';
import sunbloomImg from '../public/images/creatures/aaron_gp0_023.png';
import fenkitImg from '../public/images/creatures/aaron_gp0_024.png';
import auroraMothlordImg from '../public/images/creatures/aaron_gp0_025.png';
import arcticFennecImg from '../public/images/creatures/aaron_gp0_026.png';
import lopTricksterImg from '../public/images/creatures/aaron_gp0_027.png';

/**
 * Map of CardDef.id -> creature artwork URL.
 * Cards missing from this map fall back to the SVG silhouette in CardCreature.
 */
export const CREATURE_IMAGES: Record<string, string> = {
  // Original codex
  emberfang: emberfangImg,
  'moonlit-moth': moonlitMothImg,
  'crystal-toad': crystalToadImg,
  'shadow-sprout': shadowSproutImg,
  'azure-griffin': azureGriffinImg,
  'golden-goblin': goldenGoblinImg,
  'neon-wyvern': neonWyvernImg,
  'ancient-slime-king': ancientSlimeKingImg,
  'hollow-fox': hollowFoxImg,
  'starfall-serpent': starfallSerpentImg,
  'pebble-pup': pebblePupImg,
  'rust-knight': rustKnightImg,
  'aurora-finch': auroraFinchImg,
  'glacial-wurm': glacialWurmImg,
  'molten-mimic': moltenMimicImg,
  'storm-paladin': stormPaladinImg,
  'lava-larva': lavaLarvaImg,
  'verdant-vipers': verdantVipersImg,
  'iron-juggernaut': ironJuggernautImg,
  glittermouse: glittermouseImg,
  voidcaller: voidcallerImg,
  'spectral-koi': spectralKoiImg,
  'cinder-cherub': cinderCherubImg,
  thornfox: thornfoxImg,
  'cosmic-koalith': cosmicKoalithImg,

  // Filled-in gaps from gp0 series
  'oracle-newt': oracleNewtImg,
  'mirror-imp': mirrorImpImg,

  // New gp0 cards
  'bramble-cat': brambleCatImg,
  'pebble-charger': pebbleChargerImg,
  dustwing: dustwingImg,
  'twigsnatch-sparrow': twigsnatchSparrowImg,
  'crimson-raptor': crimsonRaptorImg,
  hearthkit: hearthkitImg,
  'midnight-stalker': midnightStalkerImg,
  'frosthoot-owl': frosthootOwlImg,
  'eldritch-husk': eldritchHuskImg,
  'frostfang-wolf': frostfangWolfImg,
  burlybear: burlybearImg,
  stagcoral: stagcoralImg,
  'hornshell-beetle': hornshellBeetleImg,
  'yokai-trickster': yokaiTricksterImg,
  'bramble-howler': brambleHowlerImg,
  'twister-imp': twisterImpImg,
  'coral-cat': coralCatImg,
  'acorn-stash': acornStashImg,
  'twilight-petal': twilightPetalImg,
  whiskerling: whiskerlingImg,
  sunbloom: sunbloomImg,
  fenkit: fenkitImg,
  'aurora-mothlord': auroraMothlordImg,
  'arctic-fennec': arcticFennecImg,
  'lop-trickster': lopTricksterImg,
};

export function getCreatureImage(cardId: string | undefined): string | undefined {
  if (!cardId) return undefined;
  return CREATURE_IMAGES[cardId];
}

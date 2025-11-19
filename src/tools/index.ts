import { LobeBuiltinTool } from '@lobechat/types';

import { isDesktop } from '@/const/version';

import { LocalSystemManifest } from './local-system';
import { WebBrowsingManifest } from './web-browsing';

export const builtinTools: LobeBuiltinTool[] = [
  {
    hidden: !isDesktop,
    identifier: LocalSystemManifest.identifier,
    manifest: LocalSystemManifest,
    type: 'builtin',
  },
  {
    hidden: true,
    identifier: WebBrowsingManifest.identifier,
    manifest: WebBrowsingManifest,
    type: 'builtin',
  },
];

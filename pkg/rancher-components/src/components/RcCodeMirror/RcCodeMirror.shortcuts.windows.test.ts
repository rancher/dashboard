// Must come first: it sets the platform CodeMirror reads when it loads
import './testing/platform-windows';
import RcCodeMirror from './RcCodeMirror.vue';
import { describeShortcuts } from './testing/shortcut-cases';

describeShortcuts(RcCodeMirror, 'windows');

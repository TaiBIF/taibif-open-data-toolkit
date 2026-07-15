import { registerIntroHandlers } from './project_page/intro';
import { registerProjectHandlers } from './project_page/projects';
import { registerTemplateHandlers } from './project_template/template';
import { registerEditHandlers } from './edit_page/edit';
import { registerCleanHandlers } from './clean_page/clean';

export const registerAllIpcHandlers = () => {
  registerIntroHandlers();
  registerProjectHandlers();
  registerTemplateHandlers();
  registerEditHandlers();
  registerCleanHandlers();
};

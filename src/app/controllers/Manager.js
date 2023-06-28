import { Router } from 'express';
import Project from '@/app/schemas/Project';
import Slugify from '@/utils/Slugify';
import AuthMiddleware from '@/app/middlewares/Auth';

const router = new Router();

router.get('/', (req, res) => {
  Project.find()
    .then((data) => {
      const projects = data.map((project) => {
        return { title: project.title, category: project.category };
      });
      return res.status(200).send(projects);
    })
    .catch((error) => {
      console.error('Error loading all the projects!', error);
      return res.status(400).send({
        error: 'Bad request!',
      });
    });
});

router.get('/:projectSlug', (req, res) => {
  Project.findOne({ slug: req.params.projectSlug })
    .then((project) => {
      return res.status(200).send(project);
    })
    .catch((error) => {
      console.error('Error loading the project!', error);
      return res.status(400).send({
        error: 'Bad request!',
      });
    });
});

router.post('/', AuthMiddleware, (req, res) => {
  const { title, description, category } = req.body;
  Project.create({ title, description, category })
    .then((project) => {
      return res.status(200).send(project);
    })
    .catch((error) => {
      console.error('Error saving new project in the database!', error);
      return res.status(400).send({
        error: 'Bad request.',
      });
    });
});

router.put('/:projectId', AuthMiddleware, (req, res) => {
  const { title, description, category } = req.body;
  let slug = undefined;
  if (title) {
    slug = Slugify(title);
  }

  Project.findByIdAndUpdate(
    req.params.projectId,
    { title, slug, description, category },
    { new: true },
  )
    .then((project) => {
      return res.status(200).send(project);
    })
    .catch((error) => {
      console.error('Error updating the project in the database!', error);
      return res.status(400).send({
        error: 'Bad request.',
      });
    });
});

router.delete('/:projectId', AuthMiddleware, (req, res) => {
  Project.findByIdAndRemove(req.params.projectId)
    .then(() => {
      return res.status(200).send({ message: 'Project removed successfully.' });
    })
    .catch((error) => {
      console.error('Error removing the project of the database!', error);
      return res.status(400).send({
        error: 'Bad request.',
      });
    });
});

export default router;

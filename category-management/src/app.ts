import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import routes from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import logger from './utils/logger';

class App {
    public app: Application;

    constructor() {
        this.app = express();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private initializeMiddlewares(): void {
        // Security middleware
        this.app.use(helmet());

        // CORS support
        this.app.use(cors());

        // Parse JSON bodies
        this.app.use(express.json({ limit: '1mb' }));

        // Parse URL-encoded bodies
        this.app.use(express.urlencoded({ extended: true, limit: '1mb' }));

        // Compress responses
        this.app.use(compression());

        // Request logging
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            logger.info(`${req.method} ${req.path}`);
            next();
        });
    }

    private initializeRoutes(): void {
        this.app.get('/health', (req: Request, res: Response) => {
            res.status(200).json({ status: 'ok' });
        });

        this.app.use('/api', routes);

        // Handle 404 errors
        this.app.use('*', (req: Request, res: Response) => {
            res.status(404).json({
                success: false,
                message: `Route ${req.originalUrl} not found`,
            });
        });
    }

    private initializeErrorHandling(): void {
        this.app.use(errorMiddleware);
    }
}

export default new App().app;
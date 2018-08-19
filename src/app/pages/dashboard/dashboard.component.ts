import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore } from 'angularfire2/firestore';
import { AuthService } from 'app/core/services/auth';
import { ProjectsService } from 'app/core/services/projects';
import { Project } from 'app/shared/models/firestore';
import { Observable, of } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';

@Component({
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  projects$: Observable<ReadonlyArray<Project>>;
  isAuthenticated$: Observable<boolean>;

  constructor(
    private readonly angularFirestore: AngularFirestore,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly projectsService: ProjectsService,
  ) {}

  ngOnInit() {
    this.projects$ = this.authService.observeCurrentUserId().pipe(
      switchMap(userId => {
        return userId ? this.projectsService.queryProjectsForUser(userId) : of([] as Project[]);
      }),
    );
    this.isAuthenticated$ = this.authService.observeIsAuthenticated();
  }

  onCreateNewProjectClick() {
    this.router.navigateByUrl(`/project/${this.angularFirestore.createId()}`);
  }

  onMyProjectsClick() {
    this.authService
      .observeCurrentUser()
      .pipe(first())
      .subscribe(user => this.router.navigateByUrl(`/user/${user.id}`));
  }

  onSignInClick() {
    this.authService.showSigninDialog();
  }

  onSignOutClick() {
    this.authService.showSignoutDialog();
  }

  onProjectClick(project: Project) {
    this.router.navigateByUrl(`/project/${project.id}`);
  }

  onDeleteProjectClick(project: Project) {
    this.projectsService.deleteProject(project);
  }
}

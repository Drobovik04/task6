using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Diagnostics;
using task6.Hub;
using task6.Models;

namespace task6.Controllers
{
    public class PresentationController : Controller
    {
        private PresentationHub _presentationHub;
        public PresentationController(PresentationHub presentation)
        {
            _presentationHub = presentation;
        }

        public IActionResult Index()
        {
            return View(_presentationHub._state.Presentations);
        }

        [HttpPost]
        public async Task<IActionResult> Join(string idPresentation, string nickName)
        {
            if (nickName == null || nickName.Length == 0)
            {
                TempData["ErrorUsername"] = "User name cannot be empty";
                return RedirectToAction("Index");
            }
            var isExists = _presentationHub._state.Presentations.First(x => x.Id == idPresentation).Users.Any(y => y.Nickname == nickName);
            if (isExists)
            {
                TempData["ErrorUsername"] = "User name already exists";
                return RedirectToAction("Index");
            }
            return RedirectToAction("Presentation", new {idPresentation, isOwner = false, nickName});
        }

        [HttpPost]
        public async Task<IActionResult> Create(string conferenceName, string nickName)
        {
            if (conferenceName.Length == 0)
            {
                TempData["ErrorCreate"] = "Presentation name cannot be empty";
                return RedirectToAction("Index");
            }
            string? idPresentation = await _presentationHub.CreatePresentation(conferenceName, nickName);
            if (idPresentation == null)
            {
                TempData["ErrorCreate"] = "Presentation name already exists";

                return RedirectToAction("Index");
            }
            return RedirectToAction("Presentation", new { idPresentation, isOwner = true, nickName});
        }

        public IActionResult Presentation(string idPresentation, bool isOwner, string nickName)
        {
            var pres = _presentationHub._state.Presentations.FirstOrDefault(x => x.Id == idPresentation);
            if (pres == null) return NotFound();
            ViewData["Owner"] = isOwner;
            ViewData["NickName"] = nickName;
            if (pres.Users.Find(x => x.Nickname == nickName) != null)
            {
                pres.Users = new List<User>();
            }
            return View(pres);
        }
    }
}
